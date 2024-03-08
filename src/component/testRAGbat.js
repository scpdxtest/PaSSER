import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import {Ollama} from 'langchain/llms/ollama';
import {OllamaEmbeddings} from 'langchain/embeddings/ollama';
import { Chroma } from "langchain/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { ProgressBar } from 'primereact/progressbar';
import { RetrievalQAChain } from "langchain/chains";
import { loadQAStuffChain } from "langchain/chains";
import axios from 'axios';
import { FilterMatchMode } from 'primereact/api';
import './testRAGbat.css';
import configuration from './configuration.json';

const TestRAGbat = () => {
    const [selectedChromaDB, setSelectedChromaDB] = useState('');
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [collections, setCollections] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedDB, setSelectedDB] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expectedAnswer, setExpectedAnswer] = useState('');
    const [testName, setTestName] = useState('');
    const [QAJSON, setQAJSON] = useState([{}]);
    const [isTesting, setIsTesting] = useState(false);
    const [total, setTotal] = useState(0);
    const [completed, setCompleted] = useState(0);

    const embeddings_open = new OllamaEmbeddings({
        model: selectedModel, 
        baseUrl: selectedOllama 
      });

    const mdl = new Ollama({
        baseUrl: selectedOllama, 
        model: selectedModel, 
        requestOptions: {
            num_gpu: 1,
        }
    });  

    const listCollections = async (ch) => {
        const client = new ChromaClient({path: ch});

        let collection2 = await client.listCollections();

        const collectionsWithIdAndName = collection2.map((collection) => ({
            name: collection.name,
            id: collection.id,
        }));
        setCollections(collectionsWithIdAndName);
    };

    useEffect(() => {
        const ch = localStorage.getItem("selectedChromaDB") || 'http://127.0.0.1:8000';
        setSelectedChromaDB(ch);
        const ol = localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434';
        setSelectedOllama(ol);
        const mdl = localStorage.getItem("selectedLLMModel") || 'mistral';
        setSelectedModel(mdl);
        listCollections(ch);
    }, []);

    const rowClass = (rowData) => {
        return {
            'p-highlight': rowData.name === selectedDB,
        };
    };

    const onRowSelect = async (e) => {
        setSelectedDB(e.data.name);
    };

    function handleFileChange(files) {
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const contents = e.target.result;
                try {
                    const json = JSON.parse(contents);
                    setQAJSON(json);
                } catch (error) {
                    console.error('Error parsing JSON', error);
                }
            };
            reader.readAsText(file);
        }
    }
    
    const startTest = async () => {
        setIsTesting(true);
        setTotal(QAJSON.length);
        for (let i = 0; i < QAJSON.length; i++) {
            console.log("QAJSON[i]", QAJSON[i], i);
            const question = QAJSON[i].question;
            const answer = QAJSON[i].answer;

            const mdl1 = new Ollama({
                baseUrl: selectedOllama,
                model: selectedModel 
            });  
    
            const vectorStore1 = await Chroma.fromExistingCollection(
                embeddings_open,
                {
                    collectionName: selectedDB,
                    url: selectedChromaDB 
                });

            const retriever = vectorStore1.asRetriever();
            const chain = new RetrievalQAChain({
                combineDocumentsChain: loadQAStuffChain(mdl1),
                retriever,
                returnSourceDocuments: true,
                inputKey: "question",
            });
    
            const res = await chain.call({
                question: question,
            });  
    
            console.log("answer", res.text);
            
            const metrics = {
                reference: QAJSON[i].answer, 
                candidate: res.text, 
                userID: localStorage.getItem("wharf_user_name"), 
                testID: testName,
                description: 'question: ' + question.replace(/[^\x00-\x7F]/g, "") + ', answer: ' + res.text.replace(/[^\x00-\x7F]/g, "")
            }
            console.log("to back ----> ", metrics.description);
            await axios.post(configuration.PytonScore + '/metrics', metrics);

            setCompleted(i + 1);
        }
        setIsTesting(false);
    };

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            <div style={{ width: '40%'}}>
                <h3>Manage DB</h3>
                <DataTable style={{width: '90%'}} value={collections}   
                onRowSelect={onRowSelect} selectionMode="single" selection={selectedDB}
                rowClassName={rowClass} filters={filters} filterDisplay="row"
                size={"small"} showGridlines stripedRows>
                    <Column field="name" header="Name" filter filterPlaceholder="By name"></Column>
                    <Column field="id" header="ID"></Column>
                </DataTable>
            </div>

            {dialogVisible &&
            <div style={{ width: '90%', marginLeft: '20px'}}>
                <h3>Input Parameters</h3>
                <br></br>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                        <label>Test Name</label>
                        <InputText id="testName" style={{ width: '100%' }} value={testName} onChange={(e) => setTestName(e.target.value)} />   
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                        <label htmlFor="fileInput">Select JSON Query</label>
                        <input type="file" id="fileInput" style={{ width: '100%' }} onChange={(e) => handleFileChange(e.target.files)} />
                    </div>
                </div>                
                <br></br>
                <Button label="Test" style={{marginTop: '10px'}} onClick={async () => {startTest();}} className="p-ml-2" />    
                {isTesting && <ProgressBar                             
                            value={((completed / total) * 100).toFixed(2)} 
                            style={{ width: '90%', marginTop: '10px' }} />}
            </div>}
        </div>
    );
}

export default TestRAGbat