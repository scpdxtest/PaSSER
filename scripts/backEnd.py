import pyntelope
import json
import os
import nltk
import torch
import numpy as np
from nltk.translate.meteor_score import single_meteor_score
from rouge import Rouge 
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from nltk.lm.preprocessing import padded_everygram_pipeline
from nltk.lm import Laplace
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.lm import Lidstone
from transformers import BertTokenizer, BertModel
from scipy.spatial.distance import cityblock  # Manhattan Distance
from scipy.spatial.distance import jaccard
from scipy.stats import spearmanr, pearsonr

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/metrics', methods=['POST'])
def metrics():
    data = request.json
    if not data:
        return jsonify({'error': 'JSON data is missing.'}), 400

    reference = data.get('reference')
    if not reference:
        return jsonify({'error': 'Reference parameter is missing.'}), 400
    candidate = data.get('candidate')
    if not candidate:
        return jsonify({'error': 'Candidate parameter is missing.'}), 400
    userID = data.get('userID')
    if not userID:
        return jsonify({'error': 'userID parameter is missing.'}), 400
    testID = data.get('testID')
    if not testID:
        return jsonify({'error': 'testID parameter is missing.'}), 400
    description = data.get('description')
    if not testID:
        return jsonify({'error': 'Description parameter is missing.'}), 400
    
    print("reference ---> ", reference)
    print("candidate ---> ", candidate)
    print("userID ---> ", userID)
    print("testID ---> ", testID)
    print("description ---> ", description)

    calc_metrics(reference, candidate, userID, testID, description)
    return jsonify({'message': 'Metrics calculated successfully.'})

def calc_metrics (reference:str, candidate:str, userID:str, testID:str, description:str)->str:

    meteor_score = single_meteor_score(reference.split(), candidate.split())
    print("METEOR", meteor_score)

    hypothesis = reference
    ref = candidate

    rouge = Rouge()
    rouge_scores = rouge.get_scores(hypothesis, ref)

    print("ROUGE", rouge_scores)
    
   # Reference and candidate sentences should be tokenized
    reference_blue = reference.split()
    candidate_blue = candidate.split()

    # Create a smoothing function
    smoothie = SmoothingFunction().method4

    # Calculate BLEU score with smoothing
    blue_score = sentence_bleu([reference_blue], candidate_blue, smoothing_function=smoothie)

    print("BLEU", blue_score)

    # Example text paragraph
    text_paragraph = reference
    # Tokenize the text into sentences
    tokenized_text = [list(map(str.lower, word_tokenize(sent))) for sent in nltk.sent_tokenize(text_paragraph)]

    # Train-test split (in a real scenario, you should use separate training and testing sets)
    train_data, vocab = padded_everygram_pipeline(2, tokenized_text)  # Example uses a bigram model

    # Train an n-gram model with Laplace smoothing (add-one smoothing)
    model = Laplace(2)  # Using a bigram model for this example
    model.fit(train_data, vocab)

    # Function to calculate perplexity
    def calculate_perplexity(model, text):
        test_data, _ = padded_everygram_pipeline(2, [word_tokenize(text.lower())])
        return model.perplexity(next(test_data))

    # Example text to evaluate
    test_text = candidate

    # Calculate perplexity
    laplace_perplexity = calculate_perplexity(model, test_text)
    print(f"Laplace Perplexity: {laplace_perplexity}")

    # Sample training text
    training_text = reference
    # Tokenizing the training text into sentences and then into words
    tokenized_text = [list(map(str.lower, word_tokenize(sent))) for sent in sent_tokenize(training_text)]

    # Preparing the training data for a trigram model
    n = 3  # Order of the n-gram model
    train_data, padded_sents = padded_everygram_pipeline(n, tokenized_text)

    # Creating and training the language model with Lidstone smoothing
    # gamma is the Lidstone smoothing parameter, typically a small fraction
    gamma = 0.1
    model = Lidstone(order=n, gamma=gamma)
    model.fit(train_data, padded_sents)

    # Sample text paragraph to calculate perplexity
    test_text = candidate
    # Tokenizing the test text
    tokenized_test_text = [list(map(str.lower, word_tokenize(sent))) for sent in sent_tokenize(test_text)]
    # Preparing the test data
    test_data, _ = padded_everygram_pipeline(n, tokenized_test_text)

    # Calculating and printing the perplexity of the test text
    # Perplexity is calculated as the exponentiated negative average log-likelihood of the test set
    lidstone_perplexity = model.perplexity(next(test_data))
    print(f"Lidstone Perplexity of the test text: {lidstone_perplexity}")

    # Function to encode text to BERT embeddings
    def get_bert_embedding(text, tokenizer, model):
        # Tokenize and convert to tensor
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        # Get embeddings
        with torch.no_grad():
            outputs = model(**inputs)
        # Use the [CLS] token embedding for representing the sentence
        return outputs.last_hidden_state[:, 0, :].numpy()

    # Initialize the tokenizer and model for BERT
    tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
    model = BertModel.from_pretrained('bert-base-uncased')

    # Sample text paragraphs
    text_1 = reference
    text_2 = candidate

    # Tokenize the text paragraphs
    inputs_1 = tokenizer(text_1, return_tensors='pt', padding=True, truncation=True, max_length=512)
    inputs_2 = tokenizer(text_2, return_tensors='pt', padding=True, truncation=True, max_length=512)

    # Generate embeddings
    with torch.no_grad():
        outputs_1 = model(**inputs_1)
        outputs_2 = model(**inputs_2)

    # Get the embeddings for the [CLS] token (used as the aggregate representation for classification tasks)
    embeddings_1 = outputs_1.last_hidden_state[:, 0, :]
    embeddings_2 = outputs_2.last_hidden_state[:, 0, :]

    # Calculate cosine similarity between the two embeddings
    cosine_similarity = torch.nn.functional.cosine_similarity(embeddings_1, embeddings_2)

    # Function to encode text to BERT embeddings
    def get_bert_embedding_manhatan(text, tokenizer, model):
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        with torch.no_grad():
            outputs = model(**inputs)
        # Aggregate embedding representation
        return outputs.last_hidden_state.mean(dim=1).numpy()

    embedding1M = get_bert_embedding_manhatan(text_1, tokenizer, model)
    embedding2M = get_bert_embedding_manhatan(text_2, tokenizer, model)

    # Calculate Pearson Correlation Coefficient
    pearson_corr, _ = pearsonr(embedding1M.flatten(), embedding2M.flatten())

    print(f"Cosine similarity: {cosine_similarity.item()}")
    print(f"Pearson Correlation Coefficient: {pearson_corr}")

    from collections import Counter

    def f1_score(prediction, truth):
        prediction_tokens = prediction.strip().lower().split()
        truth_tokens = truth.strip().lower().split()
        common_tokens = Counter(prediction_tokens) & Counter(truth_tokens)
        num_same = sum(common_tokens.values())

        if num_same == 0:
            return 0

        precision = 1.0 * num_same / len(prediction_tokens)
        recall = 1.0 * num_same / len(truth_tokens)
        f1 = (2 * precision * recall) / (precision + recall)

        return f1

    # Example
    prediction = candidate
    truth = reference

    f1 = f1_score(prediction, truth)

    print(f"F1 Score: {f1:.3f}")

    res = [meteor_score, blue_score, 
           rouge_scores[0]['rouge-1']['r'], rouge_scores[0]['rouge-1']['p'], rouge_scores[0]['rouge-1']['f'],
           rouge_scores[0]['rouge-2']['r'], rouge_scores[0]['rouge-2']['p'], rouge_scores[0]['rouge-2']['f'],
           rouge_scores[0]['rouge-l']['r'], rouge_scores[0]['rouge-l']['p'], rouge_scores[0]['rouge-l']['f'],
           laplace_perplexity, lidstone_perplexity, 
           cosine_similarity.item(),
           pearson_corr, f1]

    print("Create Transaction")
    data=[
        pyntelope.Data(
            name="creator",
            value=pyntelope.types.Name(userID), 
        ),
        pyntelope.Data(
            name="testid",
            value=pyntelope.types.Name(testID), 
        ),
        pyntelope.Data(
            name="description",
            value=pyntelope.types.String(description),
        ),
        pyntelope.Data(
            name="results",
            value=pyntelope.types.Array.from_dict(res, type_=pyntelope.types.Float64),
        ),
    ]

    auth = pyntelope.Authorization(actor="llmtest", permission="active")

    action = pyntelope.Action(
        account="llmtest", # this is the contract account
        name="addtest", # this is the action name
        data=data,
        authorization=[auth],
    )

    raw_transaction = pyntelope.Transaction(actions=[action])

    print("Link transaction to the network")
    net = pyntelope.Net(host = 'http://blockchain2.uni-plovdiv.net:8033')  
    # notice that pyntelope returns a new object instead of change in place
    linked_transaction = raw_transaction.link(net=net)


    print("Sign transaction")
    key = "5HyZQrptLQnoTdjtwfMkPtgH18inm1vkSee8HBKEZHydhB79Tst"
    signed_transaction = linked_transaction.sign(key=key)

    print("Send")
    resp = signed_transaction.send()

    print("Printing the response")
    resp_fmt = json.dumps(resp, indent=4)
    print(f"Response:\n{resp_fmt}")

    return jsonify({'message': 'Metrics calculated successfully.'})

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8088)


