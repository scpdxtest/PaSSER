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

@app.route('/getnames', methods=['GET'])
def get_test_names():
    # Connect to MongoDB
    from pymongo import MongoClient
    mongo_client = MongoClient('mongodb://path:port/')  # Change URL if needed
    db = mongo_client['DB_name']  # Database name
    collection_name = 'unique_test_names' # Collection name
    # Check if collection exists
    collection_exists = collection_name in db.list_collection_names()
    if not collection_exists:
        print(f"Collection {collection_name} does not exist.")
        return jsonify({'error': 'Collection does not exist.'}), 404
    else:
        print(f"Collection {collection_name} exists.")
    # Get the collection
    metrics_collection = db[collection_name]
    # Retrieve all documents from the collection
    documents = list(metrics_collection.find({}, {'_id': 0}).sort('created_at', -1))  # Exclude the '_id' field
    # Close the MongoDB connection
    mongo_client.close()
    # Return the documents as JSON
    return jsonify(documents), 200

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

    def compute_bertscore_alternative(predictions, references):
        # You already have BERT model and tokenizer loaded in your code
        tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
        model = BertModel.from_pretrained('bert-base-uncased')
        
        # Get embeddings for predictions and references
        pred_embeddings = []
        ref_embeddings = []
        
        # Process each prediction and reference
        for pred, ref in zip([predictions], [references]):
            # Get embeddings
            pred_inputs = tokenizer(pred, return_tensors='pt', padding=True, truncation=True, max_length=512)
            ref_inputs = tokenizer(ref, return_tensors='pt', padding=True, truncation=True, max_length=512)
            
            with torch.no_grad():
                pred_outputs = model(**pred_inputs)
                ref_outputs = model(**ref_inputs)
            
            # Get token-level embeddings
            pred_emb = pred_outputs.last_hidden_state
            ref_emb = ref_outputs.last_hidden_state
            
            # Calculate F1 using cosine similarity
            similarities = torch.nn.functional.cosine_similarity(
                pred_emb.unsqueeze(2), 
                ref_emb.unsqueeze(1), 
                dim=3
            )
            
            # Calculate precision, recall, F1
            precision = similarities.max(dim=2)[0].mean().item()
            recall = similarities.max(dim=1)[0].mean().item()
            f1 = 2 * precision * recall / (precision + recall) if precision + recall > 0 else 0
            
            return {'precision': precision, 'recall': recall, 'f1': f1}
        
    bert1_score = compute_bertscore_alternative(reference, candidate)
    print("BERT Score", bert1_score)

    def evaluate_bert_rt_score(reference, candidate, tokenizer, model):
        # Create a combined input for quality assessment
        combined_text = f"Reference: {reference} Candidate: {candidate}"
        
        # Tokenize and get embeddings
        inputs = tokenizer(combined_text, return_tensors='pt', padding=True, truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get the embeddings for the [CLS] token
        cls_embedding = outputs.last_hidden_state[:, 0, :]
        
        # Simple scoring based on vector norms and similarities
        # We'll use different projections of the embedding to simulate different aspects
        
        # Get base similarity
        ref_inputs = tokenizer(reference, return_tensors='pt', padding=True, truncation=True, max_length=512)
        cand_inputs = tokenizer(candidate, return_tensors='pt', padding=True, truncation=True, max_length=512)
        
        with torch.no_grad():
            ref_outputs = model(**ref_inputs)
            cand_outputs = model(**cand_inputs)
        
        ref_emb = ref_outputs.last_hidden_state[:, 0, :]
        cand_emb = cand_outputs.last_hidden_state[:, 0, :]
        
        # Calculate base similarity
        sim = torch.nn.functional.cosine_similarity(ref_emb, cand_emb).item()
        
        # Calculate different "aspect" scores using vector projections
        
        # Coherence: how well the text flows (use normalized embedding components)
        coherence = (torch.norm(cls_embedding[:, :100]).item() / 10.0) * sim
        coherence = min(max(coherence, 0.0), 5.0)  # Scale to 0-5
        
        # Consistency: semantic alignment (direct similarity)
        consistency = sim * 5.0  # Scale similarity to 0-5
        
        # Fluency: language quality (use different embedding components)
        fluency = (torch.norm(cls_embedding[:, 100:300]).item() / 15.0) * sim
        fluency = min(max(fluency, 0.0), 5.0)  # Scale to 0-5
        
        # Relevance: how relevant the response is to the reference
        relevance = sim * 5.0  # Scale similarity to 0-5
        
        # Average score
        avg_score = (coherence + consistency + fluency + relevance) / 4.0
        
        return {
            'coherence': coherence,
            'consistency': consistency,
            'fluency': fluency,
            'relevance': relevance,
            'avg_score': avg_score
        }

    # Use the function with your existing BERT model
    bert_rt_score = evaluate_bert_rt_score(reference, candidate, tokenizer, model)
    print("BERT-RT Score", bert_rt_score)

    res = [meteor_score, blue_score, 
        rouge_scores[0]['rouge-1']['r'], rouge_scores[0]['rouge-1']['p'], rouge_scores[0]['rouge-1']['f'],
        rouge_scores[0]['rouge-2']['r'], rouge_scores[0]['rouge-2']['p'], rouge_scores[0]['rouge-2']['f'],
        rouge_scores[0]['rouge-l']['r'], rouge_scores[0]['rouge-l']['p'], rouge_scores[0]['rouge-l']['f'],
        laplace_perplexity, lidstone_perplexity, 
        cosine_similarity.item(),
        pearson_corr, f1, 
        bert1_score['precision'], bert1_score['recall'], bert1_score['f1'], 
        bert_rt_score['coherence'], bert_rt_score['consistency'], bert_rt_score['fluency'], bert_rt_score['relevance'], bert_rt_score['avg_score']]

    from pymongo import MongoClient
    import datetime

    # MongoDB connection setup
    mongo_client = MongoClient('mongodb://path:port/')  # Change URL if needed
    db = mongo_client['DB_name']  # Database name
    
    # Check if collection exists, create it if it doesn't
    collection_name = 'unique_test_names'
    collection_exists = collection_name in db.list_collection_names()
    
    if not collection_exists:
        print(f"Creating new collection: {collection_name}")
        # You can specify collection options here if needed
        db.create_collection(collection_name)
        # Optional: Create indexes for better query performance
        db[collection_name].create_index([("testid", 1)])
        db[collection_name].create_index([("userid", 1)])
        print(f"Collection {collection_name} created successfully")
    else:
        print(f"Collection {collection_name} already exists")
    
    # Now you can use the collection
    metrics_collection = db[collection_name]

    # Check if a document with the given testid already exists
    existing_doc = metrics_collection.find_one({"testid": testID})
    
    if not existing_doc:
        # Structure the document with testid, creator, and timestamp
        current_datetime = datetime.datetime.utcnow()
        
        # Create the document with the requested structure
        mongo_document = {
            "testid": testID,
            "creator": userID,
            "created_at": current_datetime,
            "results": res,
            "description": description,
            "reference": reference,
            "candidate": candidate
        }
        
        # Insert the document into MongoDB
        try:
            result = metrics_collection.insert_one(mongo_document)
            print(f"MongoDB document inserted with ID: {result.inserted_id}")
        except Exception as e:
            print(f"Error inserting document into MongoDB: {e}")
    else:
        print(f"Document with testid '{testID}' already exists in MongoDB. Skipping insertion.")
    
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
    net = pyntelope.Net(host = 'http://blockchain_path:port')  
    # notice that pyntelope returns a new object instead of change in place
    linked_transaction = raw_transaction.link(net=net)


    print("Sign transaction")
    key = "your_private_key"
    signed_transaction = linked_transaction.sign(key=key)

    print("Send")
    resp = signed_transaction.send()

    print("Printing the response")
    resp_fmt = json.dumps(resp, indent=4)
    print(f"Response:\n{resp_fmt}")

    return jsonify({'message': 'Metrics calculated successfully.'})

if __name__ == '__main__':
    # app.run(debug=True, host='127.0.0.1', port=8088)  # For local execution
    app.run(debug=True, host='host_address', port=port)  # For server installation

