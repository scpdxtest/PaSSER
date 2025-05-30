import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Load model result CSVs
file_paths = {
    "Mistral 7B": "mistral_7b_statistical_results.csv",
    "Llama 3.1 8B": "llama_3.1_8b_statistical_results.csv",
    "Granite 3.2 8B": "granite_3.2_8b_statistical_results.csv",
    "DeepSeek 8B": "deepseek_8b_statistical_results.csv"
}

# Load and combine
model_data = [pd.read_csv(path) for path in file_paths.values()]
combined_data = pd.concat(model_data, ignore_index=True)

# Prepare plot data
plot_data = combined_data[[
    "Model", "Threshold", "CPS_Improvement_%", "T-CPS_Improvement_%"
]]

# Calculate global min and max values for consistent scaling
x_max = plot_data['CPS_Improvement_%'].max()
y_max = plot_data['T-CPS_Improvement_%'].max()
x_min = plot_data['CPS_Improvement_%'].min()
y_min = plot_data['T-CPS_Improvement_%'].min()

# Add some padding (5% of range)
x_padding = (x_max - x_min) * 0.05
y_padding = (y_max - y_min) * 0.05

# Set global axis limits
x_lim = (max(0, x_min - x_padding), x_max + x_padding)
y_lim = (max(0, y_min - y_padding), y_max + y_padding)

print(f"Global X-axis range: {x_lim[0]:.2f} to {x_lim[1]:.2f}")
print(f"Global Y-axis range: {y_lim[0]:.2f} to {y_lim[1]:.2f}")

# Create figure and subplots - Make even wider for proper legend space
fig, axes = plt.subplots(2, 2, figsize=(18, 10))
axes = axes.flatten()

models = plot_data['Model'].unique()

# Create color palette for thresholds
unique_thresholds = sorted(plot_data['Threshold'].unique())
colors = sns.color_palette("viridis", len(unique_thresholds))
threshold_colors = dict(zip(unique_thresholds, colors))

# Plot each model
for i, model in enumerate(models):
    ax = axes[i]
    model_data = plot_data[plot_data['Model'] == model]
    
    # Plot points for each threshold
    for threshold in unique_thresholds:
        threshold_data = model_data[model_data['Threshold'] == threshold]
        if not threshold_data.empty:
            ax.scatter(threshold_data['CPS_Improvement_%'], 
                      threshold_data['T-CPS_Improvement_%'],
                      c=[threshold_colors[threshold]], 
                      s=100, 
                      edgecolor='black',
                      alpha=0.8)
    
    # Add diagonal line
    ax.axline((0, 0), slope=1, color="gray", linestyle="--", alpha=0.7)
    ax.set_xlabel("CPS Improvement (%)")
    ax.set_ylabel("T-CPS Improvement (%)")
    
    # Set consistent axis limits for all subplots
    ax.set_xlim(x_lim)
    ax.set_ylim(y_lim)
    
    ax.set_title(model, fontweight='bold')
    ax.grid(True, alpha=0.3)

# Create enhanced legend with threshold meanings
def get_threshold_meaning(threshold):
    """Return meaning for each threshold value"""
    threshold_meanings = {
        0.01: "Very Strict",
        0.05: "Strict", 
        0.10: "Moderate",
        0.15: "Moderate-Relaxed",
        0.20: "Relaxed",
        0.25: "Very Relaxed",
        0.30: "Lenient",
        0.35: "Very Lenient",
        0.40: "Extremely Lenient",
        1.00: "No Filtering"
    }
    return threshold_meanings.get(threshold, f"Threshold {threshold}")

# Create legend handles with meanings
legend_elements = []
for threshold in unique_thresholds:
    meaning = get_threshold_meaning(threshold)
    label = f"{threshold} ({meaning})"
    
    legend_elements.append(
        plt.Line2D([0], [0], marker='o', color='w', 
                  markerfacecolor=threshold_colors[threshold], 
                  markersize=10, markeredgecolor='black', 
                  label=label, alpha=0.8)
    )

# Adjust layout FIRST to make room for legend
plt.subplots_adjust(top=0.9, right=0.7, hspace=0.3, wspace=0.25)

# Position legend on the right with proper coordinates
legend = fig.legend(legend_elements, 
                   [element.get_label() for element in legend_elements],
                   title="Similarity Thresholds", 
                   bbox_to_anchor=(0.72, 0.8),  # Fixed coordinates
                   loc="upper left",
                   frameon=True, 
                   fancybox=True, 
                   shadow=True,
                   fontsize=9,
                   title_fontsize=11)

# Style the legend title
legend.get_title().set_fontweight('bold')

# Add explanation text below the legend
explanation_text = (
    "Lower thresholds = Stricter similarity\n"
    "Higher thresholds = More lenient\n"
    "Diagonal line = Perfect alignment"
)

fig.text(0.72, 0.4, explanation_text, 
         fontsize=9, style='italic', 
         bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgray', alpha=0.7),
         transform=fig.transFigure)

# Add compact threshold summary
threshold_summary = "Quick Reference:\n"
threshold_summary += "0.01-0.05: Strict\n"
threshold_summary += "0.10-0.20: Moderate\n"
threshold_summary += "0.25-0.40: Lenient\n"
threshold_summary += "1.00: No Filter"

fig.text(0.72, 0.15, threshold_summary, 
         fontsize=8, family='monospace',
         bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.9, edgecolor='gray'),
         transform=fig.transFigure, verticalalignment='top')

plt.suptitle("CPS vs T-CPS Improvement Across Similarity Thresholds", 
             fontsize=16, fontweight='bold')

# Save the plot
plt.savefig("cps_vs_tcps_scatter_plot.png", dpi=300, bbox_inches='tight')
plt.show()