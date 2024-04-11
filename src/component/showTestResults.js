import { ContractKit } from "@wharfkit/contract"
import {APIClient} from '@wharfkit/antelope'
import React, {useState, useEffect, Fragment} from "react";
import {DataTable} from 'primereact/datatable'
import {Column} from 'primereact/column';
import { Button } from "primereact/button";
import { Chart } from 'primereact/chart';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const ShowTestResults = () => {
    const [uniqueTests, SetUniqueTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState('');
    const [testResults, setTestResults] = useState([]);
    const [allResults, setAllResults] = useState([]);

    const rowClass = (rowData) => {
        return {
            'p-highlight': rowData.name === selectedTest,
        };
    };

    const rowClass1 = (rowData) => {
        return {
            'p-highlight': rowData.name === resTitles[chartToShow].name,
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

    const resTitles = [{name: 'METEOR', color: 'rgba(75,192,192,0.4)'}, 
                    {name: 'Rouge-1.r', color: 'rgba(255, 102, 102, 0.4)'}, {name: 'Rouge-1.p', color: 'rgba(255, 102, 102, 0.4)'}, {name: 'Rouge-1.f', color: 'rgba(255, 102, 102, 0.4)'},
                    {name: 'Rouge-2.r', color: 'rgba(255, 102, 102, 0.4)'}, {name: 'Rouge-2.p', color: 'rgba(255, 102, 102, 0.4)'}, {name: 'Rouge-2.f', color: 'rgba(255, 102, 102, 0.4)'},
                    {name: 'Rouge-l.r', color: 'rgba(255, 102, 102, 0.4)'}, {name: 'Rouge-l.p', color: 'rgba(255, 102, 102, 0.4)'}, {name: 'Rouge-l.f', color: 'rgba(255, 102, 102, 0.4)'},
                    {name: 'BLEU', color: 'rgba(173, 216, 230, 0.4)'}, {name: 'Laplace Perplexity', color: 'rgba(255, 165, 0, 0.4)'}, {name: 'Lidstone Perplexity', color: 'rgba(255, 165, 0, 0.4)'},
                    {name: 'Cosine similarity', color: 'rgba(181, 101, 29, 0.4)'}, {name: 'Pearson correlation', color: 'rgba(181, 101, 29, 0.4)'}, 
                    {name: 'F1 score', color: 'rgba(147, 112, 219, 0.4)'}]

    const resultsBodyTemplate = (rowData) => {
        var ret = '';
        for (var i=0; i < 16; i++) {
            ret += resTitles[i].name + ': ' + String(rowData.results[i]) + '\n'
        }
        return ret
    }

    const contractKit = new ContractKit({        
        client: new APIClient({url: localStorage.getItem("bcEndpoint")}),        
    });

    useEffect (() => {
        loadUniqueTests();
    }, []);

    const loadUniqueTests = async () => {
        const contract = contractKit.load("llmtest");
        const cursor = (await contract).table('testtable').query();         
        const rows = await cursor.all()
        setAllResults(getFiles(rows));
        let uniqueTestIds = Array.from(new Set(rows.map(row => String(row.testid))));
        let jsonArray = uniqueTestIds.map(id => ({ name: id }));
        SetUniqueTests(jsonArray);
    }

    const [data, setData] = useState({});
    const options = {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 0.00001,  // Adjust this value as needed
                    callback: function(value) {
                        return parseFloat(value).toFixed(5);  // Adjust the number of decimal places as needed
                    }
                }
            }
        }
    };    
    const [chartToShow, setChartToShow] = useState(0);

    const onChartSelect = (e) => {
        const name = e.data.name;
        const index = resTitles.findIndex(item => item.name === name);
        setChartToShow(index);
        const averageValue = average[index].length === 0 ? 0 : average[index];
        const sDev = stdDev[index].length === 0 ? 0 : stdDev[index];
        setData({
            labels: testResults.map((_, i) => `Test ${i + 1}`),
            datasets: [
              {
                label: resTitles[index].name,
                data: testResults.map(test => parseFloat(test.results[index])),
                backgroundColor: resTitles[index].color,
                borderColor: resTitles[index].color.replace('0.4)', '1)'),
                borderWidth: 1,
                fill: true,
              },
              {
                label: 'Average: ' + averageValue.toFixed(4),
                data: Array(testResults.length).fill(averageValue),
                type: 'line',
                borderColor: '#000000',
                borderWidth: 0.3, // Adjust this value to make the line thinner or thicker
                fill: false,
                pointRadius: 0,
                // datalabels: {
                //     align: 'end',
                //     anchor: 'end'
                // }
              },
              {
                label: 'StdDev: ' + sDev.toFixed(4),
                data: Array(testResults.length).fill(sDev),
                type: 'line',
                borderColor: 'darkblue',
                backgroundColor: 'darkblue',
                borderWidth: 0.5, // Adjust this value to make the line thinner or thicker
                fill: false,
                pointRadius: 0,
              }
            ],
            // plugins: [ChartDataLabels],
            // options: {
            //     plugins: {
            //         datalabels: {
            //             color: '#000000',
            //             formatter: (value, context) => value.toFixed(4)
            //         }
            //     }
            // }          
        });
    }

    const [average, setAverage] = useState({});
    const [stdDev, setStdDev] = useState({});

    const onRowSelect = async (e) => {
        setSelectedTest(e.data.name);
        const testID = e.data.name;
        let filteredResults = allResults.filter(result => String(result.testid) === testID);    
        setTestResults(getFiles(filteredResults));

// Calculate the average of each filteredResults.results[] and add it to average[]
        let averages = [];
        let stddevs = [];
        filteredResults.forEach(rowData => {
            rowData.results.forEach((result, i) => {
                if (!averages[i]) {
                    averages[i] = { sum: 0, count: 0 };
                }
                averages[i].sum += Number(result);
                averages[i].count++;

                if (!stddevs[i]) {
                    stddevs[i] = { sum: 0, sumOfSquares: 0, count: 0 };
                }
                const value = Number(result);
                stddevs[i].sum += value;
                stddevs[i].sumOfSquares += value * value;
                stddevs[i].count++;        
            });
        });
        averages = averages.map(avg => avg.sum / avg.count);
        setAverage(averages);
        stddevs = stddevs.map(stddev => Math.sqrt((stddev.sumOfSquares - (stddev.sum * stddev.sum) / stddev.count) / stddev.count));
        setStdDev(stddevs);
        console.log("averages", averages, chartToShow);
        const averageValue = averages[chartToShow].length === 0 ? 0 : averages[chartToShow];
        const sDev = stddevs.length === 0 ? 0 : stddevs[chartToShow];
        setData({
            labels: getFiles(filteredResults).map((_, i) => `Test ${i + 1}`),
            datasets: [
              {
                label: resTitles[chartToShow].name,
                data: getFiles(filteredResults).map(test => parseFloat(test.results[chartToShow])),
                backgroundColor: resTitles[chartToShow].color,
                borderColor: resTitles[chartToShow].color.replace('0.4)', '1)'),
                borderWidth: 1,
                fill: true,
              },
              {
                label: 'Average: ' + averageValue.toFixed(4),
                data: Array(getFiles(filteredResults).length).fill(averageValue),
                type: 'line',
                borderColor: '#000000',
                borderWidth: 0.3, // Adjust this value to make the line thinner or thicker
                fill: false,
                pointRadius: 0
              },
              {
                label: 'StdDev: ' + sDev.toFixed(4),
                data: Array(getFiles(filteredResults).length).fill(sDev),
                type: 'line',
                borderColor: 'darkblue',
                backgroundColor: 'darkblue',
                borderWidth: 0.5, // Adjust this value to make the line thinner or thicker
                fill: false,
                pointRadius: 0,
              }
            ],
        });
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
            for (var j=0; j < 16; j++) {
                tmpRes[resTitles[j].name] = String(testResults[i].results[j]);
            }           
            myData.push(tmpRes);
        }

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Convert the array to a worksheet
        const ws = XLSX.utils.json_to_sheet(myData);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Write the workbook to a file
        XLSX.writeFile(wb, 'output.xlsx');  
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

            <div style={{ width: '90%'}}>
                <h3>Test results</h3>
                <Button label="Export to Excel" style={{marginBottom: '10px'}} onClick={exportToExcel}/>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                    <div style={{ width: '20%'}}>
                        <DataTable style={{width: '90%'}} value={resTitles}   
                            onRowSelect={onChartSelect} selectionMode="single" selection={chartToShow}
                            rowClassName={rowClass1}
                            size={"small"} showGridlines stripedRows>
                            <Column field="name" header="Name"></Column>
                        </DataTable>
                    </div>
                    <div style={{ width: '100%'}}>
                        {/* <div style={{ width: '2000px', overflowX: 'scroll' }}> */}
                            <Chart type="bar" data={data} options={options} />
                        {/* </div>                     */}
                    </div>
                </div>
                {average.length > 0 ? (
                    <div style={{ 
                        width: '40%', 
                        border: '1px solid black', 
                        padding: '10px', 
                        margin: '0 auto', 
                        lineHeight: '1.5', 
                        textAlign: 'center' 
                    }}>
                        <h3>Averages</h3>
                        {average.map((average, i) => (
                            <p key={i} style={{ margin: '0.5em 0' }}><strong>{resTitles[i].name}:</strong> {average}</p>
                        ))}
                    </div>
                ) : null}                
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

export default ShowTestResults;