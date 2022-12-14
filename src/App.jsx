import React, { useEffect, useRef, useState } from "react";

import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import { v4 as uuidv4 } from 'uuid';
import moment from "moment/moment";
import "./app.css";

function App() {
    const [resetInProgress, setResetInProgress] = useState(false);
    const [isDbInitialized, setIsDbInitialized] = useState(false);
    const [connection, setConnection] = useState();
    const [resetMsg, setResetMsg] = useState("");
    const [dataArrived, setDataArrived] = useState(false);
    const [canRenderData, setCanRenderData] = useState(false);
    const [tableName, setTableName] = useState(['rows'])
    const [tableData, setTableData] = useState([`[{ "col1": 1, "col2": "foo" },{ "col1": 2, "col2": "bar" },]`]);
    const queryString = useRef("SELECT * FROM rows");
    const [rows, setRows] = useState([]);
    const [cells, setCells] = useState([]);
    const [errorMsg, setErrorMsg] = useState();

    const MANUAL_BUNDLES = {
        mvp: {
            mainModule: duckdb_wasm,
            mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', import.meta.url).toString(),
        },
        eh: {
            mainModule: duckdb_wasm_next,
            mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).toString(),
        },
    };

    useEffect(() => {
        function getDataFromMessage() {
            return new Promise((resolve, reject) => {
                const resultReturner = (e) => {
                    try {
                        resolve([e.origin, e.data]);
                    } catch (error) {
                        reject(error + 'failed');
                    }
                }

                window.addEventListener('message', resultReturner);
            });
        }

        async function processData() {
            const response = await getDataFromMessage();
            const data = response[1];
            if (data.data != null) {
                const jsonData = JSON.parse(data);
                queryString.current = jsonData[0].sql;
                setTableName([]);
                setTableData([]);
                for (let i = 0; i < jsonData[0].tables.length; i++) {
                    setTableName(oldTableName => [...oldTableName, jsonData[0].tables[i].name])
                    setTableData(oldTableData => [...oldTableData, eval("`" + JSON.stringify(jsonData[0].tables[i].tableData) + "`")])
                }
                setDataArrived(true);
            }
            else {
                setDataArrived(true);
            }
        }
        processData();
    }, [])

    useEffect(() => {
        initDatabase(tableData, tableName)
    }, [dataArrived])

    const initDatabase = async (jsonText, nameOfTable) => {
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        const c = await db.connect();

        for (let j = 0; j < jsonText.length; j++) {
            await db.registerFileText((nameOfTable[j] + '.json'), jsonText[j]);

            await c.insertJSONFromPath((nameOfTable[j] + '.json'), { name: nameOfTable[j] });
        }

        setResetInProgress(false);
        setConnection(c);
        setIsDbInitialized(true);
    }

    const runQuery = async (myString) => {
        try {

            if (myString == "") {
                setErrorMsg(["Nincs megadva SQL lek??rdez??s."]);
            }
            else {
                setCanRenderData(false);
                setResetMsg("");
                setErrorMsg("");
                let queryData = await connection.query(myString);
                console.log(queryData);

                setRows(queryData.schema.fields.map((d) => d.name));
                setCells(queryData.toArray().map(Object.fromEntries));


                setCanRenderData(true);
            }
        } catch (error) {
            console.log(error);
            setErrorMsg(["Hiba t??rt??nt ????", error.message.slice(14, -1)]);
        }
    }

    const resetTables = async () => {
        try {
            setErrorMsg("");
            setResetInProgress(true);
            await connection.close();
            setResetMsg("Vissza??ll??t??s siker??lt ???");
            setRows([]);
            setCells([]);
            initDatabase(tableData, tableName);
        } catch (error) {
            console.log(error);
            setErrorMsg(["Hiba t??rt??nt ????", error.message.slice(-1)]);
        }
    }

    return (
        <>
            {isDbInitialized ?
                <div id="pageContainer">
                    <form className="controlContainer">
                        <textarea
                            name="queryString"
                            id="" cols="60"
                            rows="6"
                            defaultValue={queryString.current}
                            ref={queryString}
                        >
                        </textarea>
                        <br />
                        <div className="buttonContainer">
                            <button
                                className="button"
                                type="button"
                                onClick={() => runQuery(queryString.current.value)}
                                disabled={resetInProgress}
                            >RUN ??????</button>
                            <button
                                className="button"
                                type="button"
                                onClick={() => resetTables()}
                            >RESET ???</button>
                        </div>
                    </form>
                    {resetMsg && <p className="sysMessageSuccess">{resetMsg}</p>}
                    {errorMsg && errorMsg.map((msg) => { return <p key={uuidv4()} className="sysMessageError">{msg}</p> })}
                    {canRenderData &&
                        <div className="tableAligner">
                            <div id="tableContainer">
                                <table>
                                    <thead>
                                        <tr>
                                            {(rows.map((header) => { return <th key={uuidv4()}>{header}</th> }))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cells.map((rowOfCells) => {
                                            return <tr key={uuidv4()}>
                                                {Object.entries(rowOfCells).map(([k, v]) => {
                                                    if (Object.prototype.toString.call(v) == '[object Date]') {
                                                        return <td key={uuidv4()}>
                                                            {moment(v).format('YYYY-MM-DD')}
                                                        </td>
                                                    }
                                                    else {
                                                        return <td key={uuidv4()}>{v}</td>
                                                    }
                                                })}
                                            </tr>
                                        }
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    }
                </div>
                : <h2 className="loading">Loading ...</h2>
            }
        </>
    )

}

export default App;