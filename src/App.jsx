import React, { useEffect, useState } from "react";

import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import { v4 as uuidv4 } from 'uuid';
import Button from 'react-bootstrap/Button';
import "bootstrap/dist/css/bootstrap.min.css";
import "./app.css";
import jsonTable1 from './testData.json';
import jsonTable2 from './testData2.json';
import jsonTable3 from './tanarok.json';


function App() {
    const jsonNames = [jsonTable1, jsonTable2, jsonTable3];
    const jsonTableNames = ["test1", "test2", "tanarok"];
    const [resetInProgress, setResetInProgress] = useState(false);
    const [rows, setRows] = useState([]);
    const [cells, setCells] = useState([]);
    const [errorMsg, setErrorMsg] = useState();
    const [isDbInitialized, setIsDbInitialized] = useState(false);
    const [connection, setConnection] = useState();
    const [resetMsg, setResetMsg] = useState("");
    const [queryString, setQueryString] = useState("selec * from test1");
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

        for (let i = 0; i < jsonTableNames.length; i++) {
            await c.insertJSONFromPath(jsonNames[i], { name: jsonTableNames[i] });
        }

        setResetInProgress(false);
        setConnection(c);
        setIsDbInitialized(true);
    }

    const runQuery = async () => {
        try {

            if (queryString == "") {
                setErrorMsg(["Nincs megadva SQL lekérdezés."]);
            }
            else {
                setCanRenderData(false);
                setResetMsg("");
                setErrorMsg("");
                let queryData = await connection.query(queryString);
                console.log(queryData);

                setRows(queryData.schema.fields.map((d) => d.name));
                setCells(queryData.toArray().map(Object.fromEntries));

                setCanRenderData(true);
            }
        } catch (error) {
            console.log(error);
            setErrorMsg(["Hiba történt 😔", error.message.slice(14, -1)]);
        }
    }

    const resetTables = async () => {
        try {
            setErrorMsg("");
            setResetInProgress(true);
            await connection.close();
            setResetMsg("Visszaállítás sikerült ✅");
            setRows([]);
            setCells([]);
            initDatabase();
        } catch (error) {
            console.log(error);
            setErrorMsg(["Hiba történt 😔", error.message.slice(-1)]);
        }
    }

    useEffect(() => {
        initDatabase();
    }, [])

    return (
        <>
            {isDbInitialized ?
                <div>
                    <form className="controlContainer">
                        <textarea
                            name="queryString"
                            id="" cols="60"
                            rows="6"
                            value={queryString}
                            onChange={e => setQueryString(e.target.value)}
                        >
                        </textarea>
                        <br />
                        <div className="buttonContainer">
                            <Button
                                onClick={() => runQuery()}
                                disabled={resetInProgress}
                                variant="primary"
                            >RUN ▶️</Button>
                            <Button
                                onClick={() => resetTables()} variant="primary">RESET ❌</Button>
                        </div>
                    </form>
                    {resetMsg && <p className="sysMessageSuccess">{resetMsg}</p>}
                    {errorMsg && errorMsg.map((msg) => { return <p key={uuidv4()} className="sysMessageError">{msg}</p> })}
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
                : <h2 className="loading">Loading ...</h2>
            }
        </>
    )

}

export default App;