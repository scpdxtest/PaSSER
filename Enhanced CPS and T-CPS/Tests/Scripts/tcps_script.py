import pandas as pd
import numpy as np
import os
import glob
import re
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
import argparse

class TCPSCalculator:
    """
    Threshold-Aware Composite Performance Score Calculator
    
    Calculates T-CPS scores for RAG systems across different similarity thresholds.
    Expects directory structure: base_dir/model_name/threshold_dir/file.xlsx
    """
    
    def __init__(self):
        # Metric weights and polarities
        self.metrics_config = {
            'METEOR': {'weight': 0.15, 'polarity': 1, 'category': 'precision'},
            'Rouge-2.f': {'weight': 0.075, 'polarity': 1, 'category': 'recall'},
            'Rouge-l.f': {'weight': 0.075, 'polarity': 1, 'category': 'recall'},
            'Bert-Score.f1': {'weight': 0.125, 'polarity': 1, 'category': 'semantic'},
            'B-RT.average': {'weight': 0.125, 'polarity': 1, 'category': 'semantic'},
            'F1 score': {'weight': 0.15, 'polarity': 1, 'category': 'precision'},
            'B-RT.fluency': {'weight': 0.10, 'polarity': 1, 'category': 'fluency'},
            'Laplace Perplexity': {'weight': 0.10, 'polarity': -1, 'category': 'fluency'},
            'Lidstone Perplexity': {'weight': 0.10, 'polarity': -1, 'category': 'fluency'}
        }
        
        # T-CPS parameters
        self.alpha = 0.1  # Consistency bonus
        self.beta = 0.05  # Variance penalty
        
        # Storage for global normalization
        self.global_stats = {}
        self.data = None
        
    def load_from_directory(self, base_dir: str) -> pd.DataFrame:
        """Load data from nested directory structure"""
        print(f"Loading data from: {base_dir}")
        
        if not os.path.exists(base_dir):
            raise FileNotFoundError(f"Directory not found: {base_dir}")
        
        all_data = []
        
        # Get model directories
        model_dirs = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
        print(f"Found model directories: {model_dirs}")
        
        for model_dir in model_dirs:
            model_path = os.path.join(base_dir, model_dir)
            model_name = self._standardize_model_name(model_dir)
            
            # Get threshold directories
            threshold_dirs = [d for d in os.listdir(model_path) if os.path.isdir(os.path.join(model_path, d))]
            
            for threshold_dir in threshold_dirs:
                threshold_path = os.path.join(model_path, threshold_dir)
                threshold_value = self._extract_threshold(threshold_dir)
                
                if threshold_value is None:
                    print(f"Warning: Could not parse threshold from {threshold_dir}")
                    continue
                
                # Find Excel files
                excel_files = glob.glob(os.path.join(threshold_path, "*.xlsx"))
                if not excel_files:
                    print(f"Warning: No Excel files in {threshold_path}")
                    continue
                
                # Load first Excel file found
                try:
                    df = pd.read_excel(excel_files[0])
                    df['Model'] = model_name
                    df['Threshold'] = threshold_value
                    
                    # Add Question_ID if missing
                    if 'Question_ID' not in df.columns:
                        df['Question_ID'] = range(1, len(df) + 1)
                    
                    all_data.append(df)
                    print(f"Loaded: {model_name} @ {threshold_value} ({len(df)} rows)")
                    
                except Exception as e:
                    print(f"Error loading {excel_files[0]}: {e}")
        
        if not all_data:
            raise ValueError("No data files loaded successfully")
        
        # Combine all data
        combined_df = pd.concat(all_data, ignore_index=True)
        
        # Validate metrics
        combined_df = self._validate_metrics(combined_df)
        
        self.data = combined_df
        print(f"Total loaded: {len(combined_df)} rows from {len(all_data)} files")
        return combined_df
    
    def _standardize_model_name(self, dir_name: str) -> str:
        """Convert directory name to standard model name"""
        mapping = {
            'mistral': 'Mistral 7B',
            'llama': 'Llama 3.1 8B',
            'granite': 'Granite 3.2 8B',
            'deepseek': 'DeepSeek 8B'
        }
        
        dir_lower = dir_name.lower()
        for key, value in mapping.items():
            if key in dir_lower:
                return value
        
        # If no match, clean and title case
        return dir_name.replace('_', ' ').replace('-', ' ').title()
    
    def _extract_threshold(self, dir_name: str) -> Optional[float]:
        """Extract threshold value from directory name"""
        # Try different patterns
        patterns = [
            r'(\d+\.\d+)',  # 0.75
            r'(\d+)$'       # 75 (convert to 0.75)
        ]
        
        for pattern in patterns:
            match = re.search(pattern, dir_name)
            if match:
                value = float(match.group(1))
                # Convert percentage to decimal
                if value > 1.0:
                    value /= 100.0
                if 0.1 <= value <= 1.0:
                    return value
        return None
    
    def _validate_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate and clean metric columns"""
        print("Validating metrics...")
        
        # Check for required columns
        missing_metrics = []
        for metric in self.metrics_config.keys():
            if metric not in df.columns:
                missing_metrics.append(metric)
        
        if missing_metrics:
            print(f"Missing metrics: {missing_metrics}")
            # Try to find similar column names
            for metric in missing_metrics:
                found = False
                for col in df.columns:
                    if self._similar_column(metric, col):
                        print(f"Mapping {col} -> {metric}")
                        df[metric] = df[col]
                        found = True
                        break
                if not found:
                    print(f"Setting {metric} to NaN")
                    df[metric] = np.nan
        
        # Convert to numeric
        for metric in self.metrics_config.keys():
            df[metric] = pd.to_numeric(df[metric], errors='coerce')
        
        return df
    
    def _similar_column(self, target: str, column: str) -> bool:
        """Check if column name is similar to target metric"""
        # Simple similarity check
        target_clean = target.lower().replace('.', '').replace('-', '').replace(' ', '')
        column_clean = column.lower().replace('.', '').replace('-', '').replace(' ', '')
        return target_clean in column_clean or column_clean in target_clean
    
    def calculate_global_stats(self):
        """Calculate global min/max for normalization"""
        print("Calculating global statistics...")
        
        for metric in self.metrics_config.keys():
            if metric in self.data.columns:
                values = self.data[metric].dropna()
                if len(values) > 0:
                    self.global_stats[metric] = {
                        'min': values.min(),
                        'max': values.max()
                    }
                    print(f"{metric}: min={self.global_stats[metric]['min']:.4f}, "
                          f"max={self.global_stats[metric]['max']:.4f}")
                else:
                    self.global_stats[metric] = {'min': 0.0, 'max': 1.0}
            else:
                self.global_stats[metric] = {'min': 0.0, 'max': 1.0}
    
    def normalize_value(self, value: float, metric: str) -> float:
        """Normalize single value using global stats"""
        if pd.isna(value):
            return 0.0
        
        stats = self.global_stats[metric]
        polarity = self.metrics_config[metric]['polarity']
        
        # Avoid division by zero
        if stats['max'] == stats['min']:
            return 1.0
        
        # Normalize based on polarity
        if polarity == 1:  # Higher is better
            normalized = (value - stats['min']) / (stats['max'] - stats['min'])
        else:  # Lower is better
            normalized = (stats['max'] - value) / (stats['max'] - stats['min'])
        
        return max(0.0, min(1.0, normalized))
    
    def calculate_threshold_weights(self, threshold: float) -> Dict[str, float]:
        """Calculate threshold-dependent weights"""
        weights = {}
        
        for metric, config in self.metrics_config.items():
            base_weight = config['weight']
            category = config['category']
            
            # Apply threshold modifier based on category
            if category == 'precision':
                modifier = 0.5 + 0.5 * threshold  # More weight at higher thresholds
            elif category == 'recall':
                modifier = 1.5 - 0.5 * threshold  # More weight at lower thresholds
            else:
                modifier = 1.0  # Constant weight
            
            weights[metric] = base_weight * modifier
        
        # Normalize weights to sum to 1
        total = sum(weights.values())
        weights = {k: v/total for k, v in weights.items()}
        
        return weights
    
    def calculate_individual_cps(self, subset: pd.DataFrame, threshold: float) -> np.ndarray:
        """Calculate CPS for individual questions"""
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
        # Normalize metrics for this subset
        normalized_data = {}
        for metric in self.metrics_config.keys():
            normalized_data[metric] = subset[metric].apply(lambda x: self.normalize_value(x, metric))
        
        # Calculate individual CPS scores
        individual_scores = []
        for i in range(len(subset)):
            score = sum(weights[metric] * normalized_data[metric].iloc[i] for metric in self.metrics_config.keys())
            individual_scores.append(score)
        
        return np.array(individual_scores)
    
    def calculate_tcps(self, model: str, threshold: float) -> Dict:
        """Calculate T-CPS for a model-threshold combination"""
        # Get data subset
        mask = (self.data['Model'] == model) & (self.data['Threshold'] == threshold)
        subset = self.data[mask]
        
        if len(subset) == 0:
            raise ValueError(f"No data for {model} at threshold {threshold}")
        
        # Calculate individual CPS scores
        individual_scores = self.calculate_individual_cps(subset, threshold)
        
        # Calculate statistics
        mean_score = np.mean(individual_scores)
        std_score = np.std(individual_scores)
        
        # Calculate consistency and variance factors
        if mean_score > 0:
            cv = std_score / mean_score
            consistency_factor = max(0, 1 - cv)
            variance_penalty = cv ** 2
        else:
            consistency_factor = 0
            variance_penalty = 0
        
        # Calculate final T-CPS
        tcps = mean_score * (1 + self.alpha * consistency_factor) - self.beta * variance_penalty
        
        return {
            'model': model,
            'threshold': threshold,
            'tcps_score': tcps,
            'base_score': mean_score,
            'consistency_factor': consistency_factor,
            'variance_penalty': variance_penalty,
            'std_score': std_score,
            'n_questions': len(individual_scores)
        }
    
    def calculate_all_tcps(self) -> pd.DataFrame:
        """Calculate T-CPS for all model-threshold combinations"""
        if self.data is None:
            raise ValueError("No data loaded")
        
        if not self.global_stats:
            self.calculate_global_stats()
        
        results = []
        combinations = self.data[['Model', 'Threshold']].drop_duplicates()
        
        print(f"Calculating T-CPS for {len(combinations)} combinations...")
        
        for _, row in combinations.iterrows():
            try:
                result = self.calculate_tcps(row['Model'], row['Threshold'])
                results.append(result)
                print(f"✓ {result['model']} @ {result['threshold']:.2f}: {result['tcps_score']:.4f}")
            except Exception as e:
                print(f"✗ {row['Model']} @ {row['Threshold']:.2f}: {e}")
        
        return pd.DataFrame(results)
    
    def create_summary_table(self, results_df: pd.DataFrame) -> pd.DataFrame:
        """Create summary table with thresholds as rows and models as columns"""
        pivot = results_df.pivot(index='threshold', columns='model', values='tcps_score')
        return pivot.round(4)
    
    def plot_performance(self, results_df: pd.DataFrame, save_path: str = None):
        """Plot T-CPS performance across thresholds"""
        plt.figure(figsize=(12, 8))
        
        for model in results_df['model'].unique():
            model_data = results_df[results_df['model'] == model].sort_values('threshold')
            plt.plot(model_data['threshold'], model_data['tcps_score'], 
                    marker='o', linewidth=2, label=model)
        
        plt.xlabel('Similarity Threshold')
        plt.ylabel('T-CPS Score')
        plt.title('T-CPS Performance Across Similarity Thresholds')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.show()
    
    def analyze_model(self, model: str, results_df: pd.DataFrame) -> Dict:
        """Analyze performance for a specific model"""
        model_data = results_df[results_df['model'] == model].sort_values('threshold')
        
        if len(model_data) == 0:
            raise ValueError(f"No data for model: {model}")
        
        # Find optimal threshold
        best_idx = model_data['tcps_score'].idxmax()
        optimal = model_data.loc[best_idx]
        
        return {
            'model': model,
            'optimal_threshold': optimal['threshold'],
            'max_tcps': optimal['tcps_score'],
            'min_tcps': model_data['tcps_score'].min(),
            'mean_tcps': model_data['tcps_score'].mean(),
            'std_tcps': model_data['tcps_score'].std()
        }
    
    def export_results(self, results_df: pd.DataFrame, prefix: str = "tcps"):
        """Export results to multiple formats"""
        # Detailed results
        results_df.to_csv(f"{prefix}_detailed.csv", index=False)
        
        # Summary table
        summary = self.create_summary_table(results_df)
        summary.to_csv(f"{prefix}_summary.csv")
        
        # Model analysis
        with open(f"{prefix}_analysis.txt", 'w') as f:
            f.write("T-CPS Model Analysis\n")
            f.write("=" * 50 + "\n\n")
            
            for model in results_df['model'].unique():
                analysis = self.analyze_model(model, results_df)
                f.write(f"Model: {analysis['model']}\n")
                f.write(f"  Optimal threshold: {analysis['optimal_threshold']:.2f}\n")
                f.write(f"  Max T-CPS: {analysis['max_tcps']:.4f}\n")
                f.write(f"  Mean T-CPS: {analysis['mean_tcps']:.4f}\n")
                f.write(f"  Std T-CPS: {analysis['std_tcps']:.4f}\n\n")
        
        print(f"Results exported: {prefix}_detailed.csv, {prefix}_summary.csv, {prefix}_analysis.txt")

def main():
    """Main execution function"""
    # CHANGE THIS PATH TO YOUR DATA DIRECTORY
    parser = argparse.ArgumentParser(description='Calculate global min/max for metrics across all Excel files.')
    parser.add_argument('directory', help='Root directory to search for Excel files')
    args = parser.parse_args()
    print(f"Calculating global min/max for metrics in directory: {args.directory}")
    base_directory = args.directory
    
    try:
        # Initialize calculator
        calculator = TCPSCalculator()
        
        # Load data
        data = calculator.load_from_directory(base_directory)
        
        # Calculate T-CPS scores
        results = calculator.calculate_all_tcps()
        
        # Display summary
        print("\nT-CPS Summary:")
        print(calculator.create_summary_table(results))
        
        # Show model analysis
        print("\nModel Analysis:")
        for model in results['model'].unique():
            analysis = calculator.analyze_model(model, results)
            print(f"{model}: optimal={analysis['optimal_threshold']:.2f}, "
                  f"max={analysis['max_tcps']:.4f}")
        
        # Create visualization
        calculator.plot_performance(results, "tcps_performance.png")
        
        # Export results
        calculator.export_results(results)
        
        print("\nAnalysis complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nExpected directory structure:")
        print("base_directory/")
        print("├── Model1/")
        print("│   ├── threshold_0.50/file.xlsx")
        print("│   └── threshold_0.55/file.xlsx")
        print("└── Model2/")
        print("    └── ...")

if __name__ == "__main__":
    main()