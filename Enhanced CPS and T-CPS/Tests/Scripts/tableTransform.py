import pandas as pd
import sys
import argparse
import os

def read_file_as_dataframe(filename):
    """
    Read a file as pandas DataFrame based on file extension
    
    Args:
        filename (str): Path to the file
        
    Returns:
        pd.DataFrame: The loaded DataFrame
    """
    
    # Check if file exists
    if not os.path.exists(filename):
        raise FileNotFoundError(f"File '{filename}' not found.")
    
    # Get file extension
    file_ext = os.path.splitext(filename)[1].lower()
    
    try:
        # Read based on file extension
        if file_ext == '.csv':
            df = pd.read_csv(filename)
        elif file_ext == '.json':
            df = pd.read_json(filename)
        elif file_ext == '.jsonl':
            df = pd.read_json(filename, lines=True)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(filename)
        elif file_ext == '.tsv':
            df = pd.read_csv(filename, sep='\t')
        elif file_ext == '.parquet':
            df = pd.read_parquet(filename)
        elif file_ext == '.pkl':
            df = pd.read_pickle(filename)
        else:
            # Try to read as CSV by default
            print(f"Unknown file extension '{file_ext}'. Trying to read as CSV...")
            df = pd.read_csv(filename)
            
        return df
        
    except Exception as e:
        print(f"Error reading file: {e}")
        return None

# Add this function after your existing read_file_as_dataframe function

def create_and_save_pivot_table(df, output_filename=None):
    """
    Create a pivot table where columns become rows and vice versa (transpose)
    and save it to a file
    
    Args:
        df (pd.DataFrame): Input DataFrame
        output_filename (str): Output filename (optional)
        
    Returns:
        pd.DataFrame: Transposed DataFrame
    """
    
    # Create pivot table (transpose)
    pivot_df = df.transpose()
    
    # Reset index to make the original column names a column
    pivot_df = pivot_df.reset_index()
    
    # Rename the index column to something more meaningful
    pivot_df.rename(columns={'index': 'original_columns'}, inplace=True)
    
    # Remove any rows that contain "Excel Row" or similar unwanted entries
    pivot_df = pivot_df[~pivot_df['original_columns'].astype(str).str.contains('Excel Row', case=False, na=False)]
    
    # Optional: Remove any rows where original_columns is NaN or empty
    pivot_df = pivot_df.dropna(subset=['original_columns'])
    pivot_df = pivot_df[pivot_df['original_columns'].astype(str).str.strip() != '']
    
    # Reset index after filtering
    pivot_df = pivot_df.reset_index(drop=True)
    
    print(f"Original shape: {df.shape}")
    print(f"Pivot table shape: {pivot_df.shape}")
    
    # Save the pivot table
    if output_filename:
        save_dataframe(pivot_df, output_filename)
    else:
        # Auto-generate filename
        timestamp = pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"pivot_table_{timestamp}.csv"
        save_dataframe(pivot_df, output_filename)
    
    return pivot_df

def save_dataframe(df, filename):
    """
    Save DataFrame to file based on extension
    
    Args:
        df (pd.DataFrame): DataFrame to save
        filename (str): Output filename
    """
    
    file_ext = os.path.splitext(filename)[1].lower()
    
    try:
        if file_ext == '.csv':
            df.to_csv(filename, index=False)
        elif file_ext == '.json':
            df.to_json(filename, orient='records', indent=2)
        elif file_ext == '.jsonl':
            df.to_json(filename, orient='records', lines=True)
        elif file_ext in ['.xlsx', '.xls']:
            df.to_excel(filename, index=False)
        elif file_ext == '.tsv':
            df.to_csv(filename, sep='\t', index=False)
        elif file_ext == '.parquet':
            df.to_parquet(filename, index=False)
        elif file_ext == '.pkl':
            df.to_pickle(filename)
        else:
            # Default to CSV
            filename_csv = filename + '.csv'
            df.to_csv(filename_csv, index=False)
            filename = filename_csv
            
        print(f"Pivot table saved to: {filename}")
        
    except Exception as e:
        print(f"Error saving file: {e}")

def main():
    # Method 1: Using command line arguments with argparse
    parser = argparse.ArgumentParser(description='Read file as DataFrame and create pivot table')
    parser.add_argument('filename', help='Path to the file to read')
    parser.add_argument('--head', type=int, default=5, help='Number of rows to display (default: 5)')
    parser.add_argument('--info', action='store_true', help='Show DataFrame info')
    parser.add_argument('--pivot', action='store_true', help='Create and save pivot table (transpose)')
    parser.add_argument('--output', help='Output filename for pivot table')
    
    args = parser.parse_args()
    
    # Read the file
    df = read_file_as_dataframe(args.filename)
    
    if df is not None:
        print(f"Successfully loaded file: {args.filename}")
        print(f"Shape: {df.shape}")
        print(f"\nFirst {args.head} rows:")
        print(df.head(args.head))
        
        if args.info:
            print("\nDataFrame Info:")
            print(df.info())
        
        # Create pivot table if requested
        if args.pivot:
            print("\n" + "="*50)
            print("CREATING PIVOT TABLE (TRANSPOSE)")
            print("="*50)
            
            pivot_df = create_and_save_pivot_table(df, args.output)
            
            print(f"\nPivot table preview:")
            print(pivot_df.head())
            
            return df, pivot_df
            
        return df
    else:
        print("Failed to load file.")
        return None

if __name__ == "__main__":
    # Use the argparse version
    result = main()
    
    # Example of additional processing you can add:
    if result is not None:
        if isinstance(result, tuple):
            df, pivot_df = result
            print("\nOriginal column names:")
            print(df.columns.tolist())
            print("\nPivot table column names:")
            print(pivot_df.columns.tolist())
        else:
            df = result
            print("\nColumn names:")
            print(df.columns.tolist())        