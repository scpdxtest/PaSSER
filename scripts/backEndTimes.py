import pyntelope
import json
import os

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/metrics', methods=['POST'])
def timemetrics():
    data = request.json
    if not data:
        return jsonify({'error': 'JSON data is missing.'}), 400

    results = data.get('results')
    if not results:
        return jsonify({'error': 'Reesults parameter is missing.'}), 400
    userID = data.get('userID')
    if not userID:
        return jsonify({'error': 'userID parameter is missing.'}), 400
    testID = data.get('testID')
    if not testID:
        return jsonify({'error': 'testID parameter is missing.'}), 400
    description = data.get('description')
    if not testID:
        return jsonify({'error': 'Description parameter is missing.'}), 400
    
    print("results ---> ", results)
    print("userID ---> ", userID)
    print("testID ---> ", testID)
    print("description ---> ", description)

    calc_metrics(results, userID, testID, description)
    return jsonify({'message': 'Metrics stored successfully.'})

def calc_metrics (results:str, userID:str, testID:str, description:str)->str:

    res = [float(part) for part in results.split(",")]

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
        name="addtimetest", # this is the action name
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
    app.run(debug=True, host='127.0.0.1', port=8089)


