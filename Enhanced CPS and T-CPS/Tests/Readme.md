Enhanced CPS and T-CPS for RAG Threshold Analysis
Overview
This repository contains the complete implementation and evaluation materials for similarity threshold tuning in Retrieval-Augmented Generation (RAG) systems across four open-source language models.
Repository Structure
Enhanced CPS and T-CPS/
├── algorithms/
│   ├── cps_implementation.py          # Core CPS computation algorithm
│   ├── tcps_implementation.py         # T-CPS with variance penalty
│   ├── metric_normalization.py       # Metric preprocessing and scaling
│   └── statistical_validation.py     # T-tests and significance analysis
├── datasets/
│   ├── qa_pairs_369.json            # Complete question-answer dataset
│   ├── agricultural_corpus/          # Source knowledge base
│   └── data_preprocessing.py         # Dataset preparation scripts
├── results/
│   ├── mistral_7b_results.csv       # Complete Mistral 7B analysis
│   ├── granite_32_8b_results.csv    # Complete Granite 3.2 8B analysis
│   ├── llama_31_8b_results.csv      # Complete Llama 3.1 8B analysis
│   ├── deepseek_8b_results.csv      # Complete DeepSeek 8B analysis
│   └── summary_statistics.json      # Cross-model comparison data
├── analysis/
│   ├── threshold_analysis.py        # Threshold-by-threshold evaluation
│   ├── sensitivity_patterns.py      # Model sensitivity characterization
│   ├── cps_tcps_comparison.py       # CPS vs T-CPS relationship analysis
│   └── visualization_scripts.py     # Figure generation code
├── tests/
│   ├── unit_tests/                  # Algorithm validation tests
│   ├── reproducibility_check.py     # Full pipeline verification
│   └── test_data/                   # Sample data for testing
└── README.md                        # This file
Quick Start
1.	Install Dependencies
2.	pip install -r requirements.txt
3.	Run CPS Calculation
4.	from algorithms.cps_implementation import calculate_cps
5.	from algorithms.tcps_implementation import calculate_tcps
6.	
7.	# Load your evaluation metrics
8.	cps_score = calculate_cps(metrics_dict, weights)
9.	tcps_score = calculate_tcps(metrics_dict, weights, alpha=0.1, beta=0.05)
10.	Reproduce Paper Results
11.	python analysis/threshold_analysis.py --model all --output results/
Key Results
Model	Best Threshold	CPS Improvement	T-CPS Improvement	Significant Thresholds
Mistral 7B	0.95	4.58%	4.54%	6/10
Granite 3.2 8B	0.95	1.25%	1.25%	7/10
Llama 3.1 8B	0.90	1.58%	1.48%	3/10
DeepSeek 8B	0.90	1.01%	0.79%	2/10
Implementation Details
CPS Framework
•	Integrates 11 evaluation metrics across 4 dimensions
•	Weighted aggregation with polarity-aware normalization
•	Categories: Lexical overlap (30%), Semantic similarity (25%), Fluency & accuracy (25%), Language modeling (20%)
T-CPS Extension
•	Adds coefficient of variation-based penalty term
•	Reward factor (α = 0.1) for stable configurations
•	Penalty factor (β = 0.05) for high variability
•	Formula: T-CPS = μ × (1 + α × (1 - CV)) - β × CV²
Data Description
•	Dataset Size: 369 question-answer pairs from agricultural domain
•	Source: Climate-smart Agriculture Sourcebook
•	Models Tested: Mistral 7B, DeepSeek 8B, Llama 3.1 8B, Granite 3.2 8B
•	Threshold Range: 0.50 to 0.95 (increments of 0.05)
•	Total Tests: 16,280 evaluations
Reproducibility
All experiments can be reproduced using the provided scripts and data. The repository includes:
•	Complete raw evaluation data
•	Statistical analysis code
•	Visualization generation scripts
•	Unit tests for algorithm validation
Citation
[Add your paper citation here when published]
Contact
irina.radeva@iict.bas.bg
mddimitrova@gmail.com


