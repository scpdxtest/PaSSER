import React, { useState, useEffect, memo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {Ollama} from 'langchain/llms/ollama';
import {OllamaEmbeddings} from 'langchain/embeddings/ollama';
import { Chroma } from "langchain/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import './chatFromDB.css';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BufferMemory } from "langchain/memory";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { FilterMatchMode } from 'primereact/api';

const ChatFromDB = () => {
    const [selectedChromaDB, setSelectedChromaDB] = useState('');
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [collections, setCollections] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedDB, setSelectedDB] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tempreture, setTempreture] = useState(localStorage.getItem("chatTempreture") || '0.2');

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });

    const embeddings_open = new OllamaEmbeddings({
        model: selectedModel, 
        baseUrl: selectedOllama 
      });

    const mdl = new Ollama({
        baseUrl: selectedOllama, 
        model: selectedModel, 
        requestOptions: {
            num_gpu: 1,
            tempreture: localStorage.getItem("chatTempreture") || '0.2',
        }
    });  

    const [memory, setMemory] = useState(new BufferMemory({
        memoryKey: "chat_history",
        returnMessages: true,
    }));

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

    const onRowDoubleClick = async (e) => {
        const collection = e.data;

        const client = new ChromaClient({path: selectedChromaDB});
        let collection2 = await client.getCollection({name: e.data.name});
        let docCount = await collection2.count();
        const list = await collection2.peek(10);

        const vectorStore1 = await Chroma.fromExistingCollection(
            embeddings_open,
            {
                collectionName: e.data.name,
                url: selectedChromaDB,
            });
        const retriever = vectorStore1.asRetriever();
    
        console.log(`Double clicked on collection with ID: ${collection.id}`);
    };

    const rowClass = (rowData) => {
        return {
            'p-highlight': rowData.name === selectedDB,
        };
    };

    const copyToClipboard = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy);
    };

    const onRowSelect = async (e) => {
        setSelectedDB(e.data.name);
    };

    const [promptText, setPromptText] = useState('');
    const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = `Given the following conversation and a follow up question, return the conversation history excerpt that includes any relevant context to the question if it exists and rephrase the follow up question to be a standalone question.
    Chat History:
    {chat_history}
    Follow Up Input: {question}
    Your answer should follow the following format:
    \`\`\`
    Use the following pieces of context to answer the users question.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    ----------------
    <Relevant chat history excerpt as context here>
    Standalone question: <Rephrased question here>
    \`\`\`
    Your answer:`;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const mdl1 = new Ollama({
            baseUrl: selectedOllama, 
            model: selectedModel 
        });  

        const question = newMessage;
        setNewMessage('');
        setMessages([...messages, { text: question, sender: 'user', stat: '' }, { text: '', sender: selectedModel, stat: '' }]);

        const vectorStore1 = await Chroma.fromExistingCollection(
            embeddings_open,
            {
                collectionName: selectedDB,
                url: selectedChromaDB 
            });

        const retriever = vectorStore1.asRetriever();

        const chain = ConversationalRetrievalQAChain.fromLLM(
            mdl,
            retriever,
            { memory, 
              questionGeneratorChainOptions: {
                template: CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT,
              },
            },
            
        );

        const res = await chain.call({
            question: question,
        });  

        console.log("answer", res.text);

        setMessages(prevMessages => {
            let newMessages = [...prevMessages];
            if (newMessages.length >= 0 && newMessages[newMessages.length - 1].sender === selectedModel) {
                newMessages[newMessages.length - 1].text += res.text;
            } else {
                newMessages.push({ text: res.text, sender: selectedModel, stat: '' });
            }
            return newMessages;
        });
        setIsSubmitting(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            <div style={{ width: '40%'}}>
                <h3>SelectDB (temperature={tempreture})</h3>
                <DataTable style={{width: '90%'}} value={collections} onRowDoubleClick={onRowDoubleClick}
                    onRowSelect={onRowSelect} selectionMode="single" selection={selectedDB}
                    rowClassName={rowClass} filters={filters} filterDisplay="row"
                    size={"small"} showGridlines stripedRows>
                    <Column field="name" header="Name" filter filterPlaceholder="By name"></Column>
                    <Column field="id" header="ID"></Column>
                </DataTable>
            </div>

        {dialogVisible &&
            <div style={{ width: '90%', marginLeft: '20px'}}>
                <Card title='Chat with private LLM over selected DB' style={{ width: '95%' }}>
                    {messages.map((message, index) => (
                        <div key={index}>
                            <pre style={{ textOverflow: 'ellipsis', whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'left' }}>
                                <b>{message.sender}:</b> {message.text}
                                {message.stat ? <span style={{ color: 'blue' }}>{message.stat}</span> : null}
                            </pre>
                            <Button icon="pi pi-copy" 
                                    className="p-button-sm p-button-success p-button-outlined" 
                                    style={{ fontSize: '0.6rem', padding: '0.2rem', top: '-0.9rem'}} 
                                    onClick={() => copyToClipboard(`${message.sender}: ${message.text}`)} />                
                        </div>
                    ))}
                    <div className="p-d-flex p-ai-center p-mt-2" style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <InputText 
                            style={{ width: '80%' }}
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmit();
                                }
                            }} 
                            placeholder="Enter your question" 
                        />
                        <Button label="Ask" style={{marginLeft: '10px'}} onClick={handleSubmit} className="p-ml-2" />
                        {isSubmitting && <ProgressSpinner style={{ marginLeft: '5px', width: '2em', height: '2em' }} strokeWidth="8" />}
                    </div>
                </Card>
            </div>
        }

        </div>

    );
}

export default ChatFromDB;