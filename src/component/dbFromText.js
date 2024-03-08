import React, { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { Chroma } from "langchain/vectorstores/chroma";
import {OllamaEmbeddings} from 'langchain/embeddings/ollama';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import './dbFromText.css';
import { formatDurationToMinSec } from './mylib';

const DBFromText = () => {
    const [collectionName, setCollectionName] = useState('');
    const [textx, setTextx] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dbCreated, setDbCreated] = useState(false);
    const k_words = ["web application", "blockchain", "IPFS", "Antelope.io", "smart crop production", "big data", "platform"]
    const [selectedChromaDB, setSelectedChromaDB] = useState('');
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [duration, setDuration] = useState(0);

    const embeddings_open = new OllamaEmbeddings({
        model: selectedModel, 
        baseUrl: selectedOllama,
      });

      let startTime, endTime;

      useEffect(() => {
        const ch = localStorage.getItem("selectedChromaDB") || 'http://127.0.0.1:8000';
        setSelectedChromaDB(ch);
        const ol = localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434';
        setSelectedOllama(ol);
        const mdl = localStorage.getItem("selectedLLMModel") || 'mistral';
        setSelectedModel(mdl);
    }, []);

    const onUpload = (event) => {
        setUploading(true);
        startTime = new Date();
        const textArr = [];
        const filePromises = Array.from(event.files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = event => {
                    textArr.push(event.target.result);
                    setTextx(prevTextx => [...prevTextx, event.target.result]);
                    resolve();
                };
                reader.onerror = error => {
                    console.error('Error:', error);
                    reject(error);
                };
                reader.readAsText(file);
            });
        });
    
        Promise.all(filePromises)
            .then(() => {
                console.log('All files loaded.', textArr.length);
                fetchData(textArr)
            })
            .catch(error => {
                console.error('Error:', error);
                setUploading(false);
            });
        };

    const fetchData = async (textx) => {
        const ids = textx.map((_, index) => ({ id: index + 1, keywords: k_words }));
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 100,
        });

        const documents = textx.map((string, index) => ({
            pageContent: string,
            metadata: {
                loc: {
                    lines: {
                        from: index + 1,
                        to: string.length,
                    }
                },
                source: "test"
            }
        }));

        const splitDocs = await textSplitter.splitDocuments(documents);

        const vectorStore = await Chroma.fromDocuments(
            splitDocs,
            embeddings_open,
            {
                collectionName: collectionName,
                url: selectedChromaDB,
                collectionMetadata: {
                    "hnsw:space": "cosine",
                }
            }
        );

        const retriever = vectorStore.asRetriever();
        endTime = new Date();
        setDuration((endTime - startTime) / 1000);
        setDbCreated(true);
        setUploading(false);
        setCollectionName('');
        setTextx([]);
    };

    const onCancel = () => {
        setCollectionName('');
        setTextx([]);
        setDbCreated(false);
    };

    return (        
        <div>
            <h3>Collection Name</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <InputText style={{width: '800px'}} value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
                    {uploading ? <ProgressSpinner style={{ width: '50px', height: '50px', marginLeft: '10px' }} /> : null}      
                    {dbCreated ? <span style={{color: 'green', marginLeft: '10px'}}><b>DB Created succesfuly in {formatDurationToMinSec(duration)}</b></span> : null}
                </div>
            </div>

            <h3>Upload Files</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileUpload className="custom-file-upload" name="demo[]" style={{width: '90%', alignItems: 'center'}} multiple={true} onSelect={onUpload} accept="*" maxFileSize={10000000} disabled={!collectionName} auto chooseLabel="Select" />
            </div>
            <Button style={{marginTop: '10px'}} label="Cancel" onClick={onCancel} />
        </div>
    );
};

export default DBFromText;