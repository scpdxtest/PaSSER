# Installation Instructions

## 1. Antelope Blockchain Setup
Follow the instruction given in https://docs.eosnetwork.com/manuals/leap/v3.2.3/install/ to install Antelope blockchain node.

### a. Account Creation

#### i. Create 'llmtest' Account

cleos -u <node ip address> create account eosio llmtest <llmtest public key>

#### ii. User Account

cleos -u <node ip address> create account eosio useracc <useracc public key>

### b. Llmtest Smart Contract Deployment

cleos -u <node ip address> set contract llmtest ./ llmtest.wasm llmtest.abi

## 2. IPFS Setup

Follow the installation procedure from developper’s site https://ipfs.tech 

## 3. ChromaDB Setup

Follow the installation instruction from https://www.trychroma.com

## 4. Ollama Setup

Follow the installation instruction from https://ollama.com
Pull desired LLM from Ollama models library.

## 5. Python Backend Scripts Setup

### a. Bert-base-uncased Model

Install the model from https://huggingface.co/google-bert/bert-base-uncased in the python api’s directory.

### b. Antelope Account Private Key Deployment

Get the llmtest account private key and replace it in backEnd.py and backEndTimes.py scripts.

### c. Running as API

gunicorn -w 4 -b <your ip address>:8302 backEnd:app
gunicorn -w 4 -b <your ip address>:8303 backEndTimes:app

## 6. Anchor Setup

Install Anchor wallet from https://www.greymass.com/anchor and add your user account by its private key.

## 7. Libraries

## 7. Libraries

To install the Python libraries used in this project, you first need to create a `requirements.txt` file that lists the libraries.

You can install the libraries using pip, which is a package manager for Python. Open a terminal, navigate to the directory that contains the `requirements.txt` file, and run the following command:

```bash
pip install -r requirements.txt

## 8. ReactJS App

### a. Configuration JSON

You can find configuration.json file in src/components folder.

## 9. Git Structure

- `.gitignore`: This file tells Git which files or directories to ignore in the project.
- `README.md`: This file contains information about the project and instructions on how to use it.
- `package.json`: This file contains the list of project dependencies and other metadata.
- `src`: This directory contains all the source code for the project.
- `src/components`: This directory contains all the React components for the project.
- `src/components/configuration.json`: This file contains various configuration options for the app.
- `src/App.js`: This is the main React component that represents the entire app.
- `src/index.js`: This is the JavaScript entry point file.
- `public`: This directory contains static files like the `index.html` file.
- `scripts`: This directory contains Python backend scripts.
- `Installation Instructions.md`: This file contains instructions on how to install and set up the project.