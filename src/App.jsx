import React, { useEffect, useState } from "react";

import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import { v4 as uuidv4 } from 'uuid';
import jsonTable1 from './testData.json';
import jsonTable2 from './testData2.json';
import * as arrow from 'apache-arrow';


function App() {
    const jsonNames = [jsonTable1, jsonTable2];
    const tableNames = ["test1", "test2"];
    const [resetInProgress, setResetInProgress] = useState(false);
    const [rows, setRows] = useState([]);
    const [cells, setCells] = useState([]);
    const [errorMsg, setErrorMsg] = useState();
    const [isDbInitialized, setIsDbInitialized] = useState(false);
    const [connection, setConnection] = useState();
    const [resetMsg, setResetMsg] = useState("");
    //ideiglenes default value
    const [queryString, setQueryString] = useState("select * from test");
    const [canRenderData, setCanRenderData] = useState(false);


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

    const initDatabase = async () => {
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        const c = await db.connect();
        console.log("I've been called.");

        for (let i = 0; i < tableNames.length; i++) {
            await c.insertJSONFromPath(jsonNames[i], { name: tableNames[i] });
        }

        //await c.insertJSONFromPath(jsonTable2, { name: tableName2 });

        setResetInProgress(false);
        setConnection(c);
        setIsDbInitialized(true);

    }

    const runQuery = async () => {
        try {
            setResetMsg("");
            let queryData = await connection.query(queryString);
            console.log(queryData);

            setRows(queryData.schema.fields.map((d) => d.name));
            setCells(queryData.toArray().map(Object.fromEntries));

            setCanRenderData(true);
        } catch (error) {
            console.log(error);
            setErrorMsg(error);
        }
    }

    const resetTables = async () => {
        try {

            //let resetQueryString = ("DROP TABLE main");
            //await connection.query(resetQueryString);
            setResetInProgress(true);
            await connection.close();
            setResetMsg("Reset successful.");
            setRows([]);
            setCells([]);
            initDatabase();
        } catch (error) {

        }


    }

    useEffect(() => {
        initDatabase();
    }, [])

    return (
        <>
            {isDbInitialized ?
                <div>
                    <textarea
                        name="queryString"
                        id="" cols="60"
                        rows="5"
                        value={queryString}
                        onChange={e => setQueryString(e.target.value)}
                    >
                    </textarea>
                    <br />
                    <button
                        onClick={() => runQuery()}
                        disabled={resetInProgress}
                    >RUN</button>
                    <button onClick={() => resetTables()}>RESET</button>
                    {resetMsg && <p>{resetMsg}</p>}
                    {errorMsg && <p>{errorMsg.Error}</p>}
                    {canRenderData &&
                        <table>
                            <thead>
                                <tr>
                                    {(rows.map((header) => { return <th key={header}>{header}</th> }))}
                                </tr>
                            </thead>
                            <tbody>
                                {cells.map((rowOfCells) => {
                                    return <tr key={uuidv4()}>{Object.entries(rowOfCells).map(([k, v]) => {
                                        return <td key={k}>{v}</td>
                                    })}
                                    </tr>
                                }
                                )}
                            </tbody>
                        </table>
                    }
                </div>
                : <h2>Loading ...</h2>
            }
        </>
    )

}

export default App;