
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Load all model CSVs
file_paths = {
    "Mistral 7B": "mistral_7b_statistical_results.csv",
    "Llama 3.1 8B": "llama_3.1_8b_statistical_results.csv",
    "Granite 3.2 8B": "granite_3.2_8b_statistical_results.csv",
    "DeepSeek 8B": "deepseek_8b_statistical_results.csv"
}

# Combine all models into one DataFrame
combined_data = pd.concat(
    [pd.read_csv(path) for path in file_paths.values()],
    ignore_index=True
)

# Prepare long-format data for Seaborn
df = combined_data[[
    "Model", "Threshold", "CPS_Improvement_%", "T-CPS_Improvement_%", "Significant"
]]

df_long = pd.melt(
    df,
    id_vars=["Model", "Threshold", "Significant"],
    value_vars=["CPS_Improvement_%", "T-CPS_Improvement_%"],
    var_name="Metric",
    value_name="Improvement (%)"
)

df_long["Metric"] = df_long["Metric"].replace({
    "CPS_Improvement_%": "CPS",
    "T-CPS_Improvement_%": "T-CPS"
})

# Define bar colors
def bar_color(row):
    if row["Metric"] == "T-CPS":
        return "gray"
    return "green" if row["Significant"] else "red"

df_long["Color"] = df_long.apply(bar_color, axis=1)

# Plot
g = sns.catplot(
    data=df_long,
    x="Threshold",
    y="Improvement (%)",
    hue="Metric",
    col="Model",
    kind="bar",
    palette={"CPS": "white", "T-CPS": "gray"},
    col_wrap=2,
    height=4,
    aspect=1.3,
    dodge=True
)

# Manually apply the custom colors
for ax, (_, subdf) in zip(g.axes.flat, df_long.groupby("Model")):
    for bar, (_, row) in zip(ax.patches, subdf.iterrows()):
        bar.set_color(row["Color"])
        bar.set_edgecolor("black")

# Final formatting
g.set_titles("{col_name}")
g.set_axis_labels("Threshold", "Improvement (%)")
g.fig.subplots_adjust(top=0.9)
g.fig.suptitle("CPS vs T-CPS Improvement Across Thresholds by Model\n(CPS colored by significance)", fontsize=14)

# Save figure
plt.savefig("combined_cps_tcps_chart.png", dpi=300)
plt.show()
