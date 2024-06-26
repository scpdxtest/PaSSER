import { ContractKit } from "@wharfkit/contract"
import {APIClient} from '@wharfkit/antelope'
import React, {useState, useEffect, Fragment} from "react";
import {DataTable} from 'primereact/datatable'
import {Column} from 'primereact/column';
import { Button } from "primereact/button";

const ShowTimeTestResults = () => {
    const [uniqueTests, SetUniqueTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState('');
    const [testResults, setTestResults] = useState([]);
    const [allResults, setAllResults] = useState([]);

    const rowClass = (rowData) => {
        return {
            'p-highlight': rowData.name === selectedTest,
        };
    };

    const getFiles = (data) => {
        return [...(data || [])].map((d) => {
            d.date = new Date(d.date);
            return d;
        });
    };

    const sizeBodyTemplate = (rowData) => {
        return Number(rowData.id);
    };

    const formatDate = (value) => {
        return new Date(value);
    };

    const dateBodyTemplate = (rowData) => {
        const dt = new Date(rowData.created_at)
        return dt.toISOString();
    };

    const userBodyTemplate = (rowData) => {
        return String(rowData.userid)
    }

    const resTitles = ['Evaluation time', 'Evaluation count', 'Load duration time', 'Prompt evaluation count',
                    'Prompt evaluation duration', 'Total duration', 'Tokens per second']

    const resultsBodyTemplate = (rowData) => {
        var ret = '';
        for (var i=0; i < 6; i++) {
            ret += resTitles[i] + ': ' + String(rowData.results[i]) + '\n'
        }
        ret += resTitles[6] + ': ' + (Number(rowData.results[1]) / Number(rowData.results[0]) * 1e9).toString()
        return ret
    }

    const contractKit = new ContractKit({        
        client: new APIClient({url: localStorage.getItem("bcEndpoint")}),        
    });

    useEffect (() => {
        loadUniqueTests();
    }, []);

    const loadUniqueTests = async () => {
        console.log("loadUniqueTests");
        const contract = contractKit.load("llmtest");
        const cursor = (await contract).table('timetable').query();
            
        const rows = await cursor.all()
        setAllResults(getFiles(rows));
        let uniqueTestIds = Array.from(new Set(rows.map(row => String(row.testid))));
        let jsonArray = uniqueTestIds.map(id => ({ name: id }));
        SetUniqueTests(jsonArray);
    }

    const onRowSelect = async (e) => {
        setSelectedTest(e.data.name);
        const testID = e.data.name;
        let filteredResults = allResults.filter(result => String(result.testid) === testID);    
        setTestResults(getFiles(filteredResults));
    };

    const exportToExcel = () => {

        const XLSX = require('xlsx');
        const myData = [];
        for (var i=0; i<testResults.length; i++) {
            const dt = new Date(testResults[i].created_at);
            var tmpRes = {id: Number(testResults[i].id), 
                            date: String(testResults[i].created_at),
                            userID: String(testResults[i].userid),
                            testID: String(testResults[i].testid),
                            Description: testResults[i].description,
                        }
            for (var j=0; j < 6; j++) {
                tmpRes[resTitles[j]] = String(testResults[i].results[j]);
            }           
            tmpRes[resTitles[6]] = (Number(testResults[i].results[1]) / Number(testResults[i].results[0]) * 1e9).toString()            
            myData.push(tmpRes);
        }

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Convert the array to a worksheet
        const ws = XLSX.utils.json_to_sheet(myData);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Write the workbook to a file
        XLSX.writeFile(wb, 'times_output.xlsx');  
    }

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            <div style={{ width: '10%'}}>
                <h3>Unique tests</h3>
                <DataTable style={{width: '90%'}} value={uniqueTests}   
                onRowSelect={onRowSelect} selectionMode="single" selection={selectedTest}
                rowClassName={rowClass}
                size={"small"} showGridlines stripedRows>
                    <Column field="name" header="Name"></Column>
                </DataTable>
            </div>

            <div style={{ width: '80%'}}>
                <h3>Time Test results</h3>
                <Button label="Export to Excel" style={{marginBottom: '10px'}} onClick={exportToExcel}/>
                <DataTable style={{width: '90%'}} value={testResults}   
                    selectionMode="single"
                    rowClassName={rowClass}
                    size={"small"} showGridlines stripedRows>

                    <Column field="id" header="ID" dataType="number" body={sizeBodyTemplate}></Column>
                    <Column field="created_at" header="Date" dataType="date" body={dateBodyTemplate} style={{width: '20%'}}/>
                    <Column field="userid" header="userID" dataType="string" body={userBodyTemplate} style={{width: '10%'}}/>
                    <Column field="results" header="Results" dataType="string" body={resultsBodyTemplate} style={{width: '40%'}}/>
                    <Column field="description" header="Description" dataType="string" style={{width: '40%'}}/>
                </DataTable>
            </div>

        </div>

    );

}

export default ShowTimeTestResults;