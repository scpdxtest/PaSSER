import React, { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { Chroma } from "langchain/vectorstores/chroma";
import {OllamaEmbeddings} from 'langchain/embeddings/ollama';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import { Checkbox } from 'primereact/checkbox';
import './dbFromText.css';
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DBFromPDF = () => {
    const [collectionName, setCollectionName] = useState('');
    const [textx, setTextx] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dbCreated, setDbCreated] = useState(false);
    const [selectedChromaDB, setSelectedChromaDB] = useState('');
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [duration, setDuration] = useState(0);
    const [chunkSize, setChunkSize] = useState(1024);
    const [whole, setWhole] = useState(false);
    const [tempretures, setTempretures] = useState(0.2);
    const [overlapping, setOverlapping] = useState(50);

    let startTime, endTime;

    useEffect(() => {
        const ch = localStorage.getItem("selectedChromaDB") || 'http://127.0.0.1:8000';
        setSelectedChromaDB(ch);
        const ol = localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434';
        setSelectedOllama(ol);
        const mdl = localStorage.getItem("selectedLLMModel") || 'mistral';
        setSelectedModel(mdl);

        speak("Welcome to Vector DB creator from PDF files!");
    }, []);

    const onUpload = (event) => {
        setUploading(true);
        startTime = new Date();
        const textArr = [];
        const filePromises = Array.from(event.files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async event => {
                    const typedArray = new Uint8Array(event.target.result);
                    const pdf = await pdfjs.getDocument({data: typedArray}).promise;
                    const numPages = pdf.numPages;
            
                    if (whole) {
                        var temp = '';
                        for(let i = 1; i <= numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            const text = content.items.map(item => item.str).join(' ');              
                            temp += text;
                        }
                        textArr.push(temp);
                        setTextx(prevTextx => [...prevTextx, temp]);
                } else {
                        for(let i = 1; i <= numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            const text = content.items.map(item => item.str).join(' ');                
                            textArr.push(text);
                            setTextx(prevTextx => [...prevTextx, text]);
                        }
                    }
                    resolve();
                };
                reader.onerror = error => {
                    console.error('Error:', error);
                    reject(error);
                };
                reader.readAsArrayBuffer(file);
            });
        });

        Promise.all(filePromises)
            .then(() => {
                fetchData(textArr)
            })
            .catch(error => {
                console.error('Error:', error);
                setUploading(false);
            });
    };

    const fetchData = async (textx) => {
        console.log("textx", textx);
        const embeddings_open = new OllamaEmbeddings({
            model: selectedModel, 
            baseUrl: selectedOllama, 
            requestOptions: {
                temperature: parseFloat(tempretures),
            }
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
        let splitDocs;
        if (chunkSize !== '0') {
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: chunkSize,
                chunkOverlap: overlapping,
            });
            splitDocs = await textSplitter.splitDocuments(documents);
        } else {
            splitDocs = documents;
        };
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

    function formatDuration(durationInSeconds) {
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;

        if (minutes > 0) {
            return `${minutes} minute(s) ${seconds.toPrecision(2)} second(s)`;
        } else {
            return `${seconds} second(s)`;
        }
    }

    const onCancel = () => {
        setCollectionName('');
        setTextx([]);
        setDbCreated(false);
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    };

    return (        
        <div>
            <h3>Collection Name</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <InputText style={{width: '800px'}} value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <label>Chunk</label>
                        <InputText style={{width: '80px', marginLeft: '10px'}} value={chunkSize} onChange={(e) => setChunkSize(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <label>Ovr</label>
                        <InputText style={{width: '80px', marginLeft: '10px'}} value={overlapping} onChange={(e) => setOverlapping(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <label>Tempr</label>
                        <InputText style={{width: '80px', marginLeft: '10px'}} value={tempretures} onChange={(e) => setTempretures(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '10px' }}>
                        <label htmlFor="whole" className="p-checkbox-label">Whole</label>
                        <Checkbox inputId="whole" checked={whole} onChange={e => setWhole(e.checked)} />
                    </div>
                    {uploading ? <ProgressSpinner style={{ width: '50px', height: '50px', marginLeft: '10px' }} /> : null}      
                    {dbCreated ? <span style={{color: 'green', marginLeft: '10px'}}><b>DB Created succesfuly in {formatDuration(duration)}</b>{speak("DB Created succesfuly")}</span> : null}
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

export default DBFromPDF;