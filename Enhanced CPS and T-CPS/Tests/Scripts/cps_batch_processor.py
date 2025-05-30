
import pandas as pd

def compute_cps(metrics, min_vals, max_vals, weights, polarity):
    """
    Computes the Composite Performance Score (CPS) for a single row.

    Parameters:
    - metrics: dict {metric_name: raw_score}
    - min_vals: dict {metric_name: global_min}
    - max_vals: dict {metric_name: global_max}
    - weights: dict {metric_name: weight}, sum(weights.values()) == 1
    - polarity: dict {metric_name: +1 or -1}

    Returns:
    - CPS: float
    """
    score = 0.0
    for m in metrics:
        if m not in min_vals or m not in max_vals or m not in weights or m not in polarity:
            raise ValueError(f"Missing metadata for metric: {m}")

        d = polarity[m]
        min_val = min_vals[m]
        max_val = max_vals[m]
        if max_val == min_val:
            norm = 1.0
        else:
            numerator = d * (metrics[m] - min_val)
            denominator = max_val - min_val
            norm = (numerator / denominator) + (1 - d) / 2

        score += weights[m] * norm

    return score


def process_excel_cps(file_path):
    # Define metrics used
    metrics = ['METEOR', 'Rouge-2.f', 'Rouge-l.f', 'Bert-Score.f1',
               'B-RT.average', 'F1 score', 'B-RT.fluency',
               'Laplace Perplexity', 'Lidstone Perplexity']

# ['METEOR', 'Rouge-1.f', 'Rouge-2.f', 'Rouge-l.f', 'BLEU', 'Laplace Perplexity', 'Lidstone Perplexity', 'Cosine similarity', 'Pearson correlation', 'F1 score', 'Bert-Score.precision', 'Bert-Score.recall', 'Bert-Score.f1', 'B-RT.coherence', 'B-RT.consistency', 'B-RT.fluency', 'B-RT.relevance', 'B-RT.average']

    # Load Excel file
    df = pd.read_excel(file_path)
    # Print actual column names for debugging
    print('******************************')
    print('Available columns in Excel file:')
    print(df.columns.tolist())

    # Check which metrics exist in the DataFrame
    available_metrics = [m for m in metrics if m in df.columns]
    missing_metrics = [m for m in metrics if m not in df.columns]

    if missing_metrics:
        print('WARNING: The following metrics were not found in the Excel file:')
        for m in missing_metrics:
            print(f"  - {m}")

    # Create a new DataFrame with only the available metrics columns
    if available_metrics:
        metrics_df = df[available_metrics].copy()
        print('******************************')
        print('Metrics-only table:')
        print(metrics_df.head())  # Display first few rows
    else:
        print('ERROR: None of the specified metrics were found in the Excel file.')
        metrics_df = pd.DataFrame()  # Empty DataFrame as fallback
    
    # Define weights and polarity
    weights = {
        "METEOR": 0.15,
        "Rouge-2.f": 0.075,
        "Rouge-l.f": 0.075,
        "Bert-Score.f1": 0.125,
        "B-RT.average": 0.125,
        "F1 score": 0.15,
        "B-RT.fluency": 0.10,
        "Laplace Perplexity": 0.10,
        "Lidstone Perplexity": 0.10,
    }

    polarity = {
        "METEOR": +1,
        "Rouge-2.f": +1,
        "Rouge-l.f": +1,
        "Bert-Score.f1": +1,
        "B-RT.average": +1,
        "F1 score": +1,
        "B-RT.fluency": +1,
        "Laplace Perplexity": -1,
        "Lidstone Perplexity": -1,
    }

    # Compute min and max per metric
    min_vals = {m: df[m].min() for m in metrics}
    max_vals = {m: df[m].max() for m in metrics}

    # Compute CPS for each row
    def compute_row_cps(row):
        metric_values = {m: row[m] for m in metrics}
        return compute_cps(metric_values, min_vals, max_vals, weights, polarity)

    df['CPS'] = df.apply(compute_row_cps, axis=1)
    overall_cps = df['CPS'].mean()

    print(f"Computed CPS for {file_path}: {overall_cps:.4f}")
    return df, overall_cps

import argparse
import os

if __name__ == "__main__":
    # Example usage
    parser = argparse.ArgumentParser(description='Calculate normalized scores.')
    parser.add_argument('file', help='The Excel file to read.')
    file_path = parser.parse_args()
    print('***********', file_path.file)
    df, overall_cps = process_excel_cps(file_path.file)

    print(df[['CPS']])
    print(f"Overall CPS: {overall_cps:.4f}")
    # Save the DataFrame with CPS to a new Excel file
    # Get the directory and filename from the original path
    directory = os.path.dirname(file_path.file)
    filename = os.path.basename(file_path.file)
    
    # Split the filename into name and extension
    name, ext = os.path.splitext(filename)
    
    # Create the new filename with '_with_cps' appended
    new_filename = f"{name}_with_cps{ext}"
    
    # Create the full output path (in the same directory)
    output_file_path = os.path.join(directory, new_filename)
    
    df.to_excel(output_file_path, index=False)
    print(f"Results saved to {output_file_path}")

    