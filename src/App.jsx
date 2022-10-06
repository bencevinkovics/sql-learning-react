import React, { useEffect, useState } from "react";

import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import { v4 as uuidv4 } from 'uuid';
import './rows.json';
import * as arrow from 'apache-arrow';


function App() {
    const [myData, setMyData] = useState([]);
    const [rows, setRows] = useState([]);
    const [cells, setCells] = useState([]);
    const [errorMsg, setErrorMsg] = useState();
    const [isDbInitialized, setIsDbInitialized] = useState(false);
    const [connection, setConnection] = useState();
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

    const loadSite = async () => {
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        const c = await db.connect();

        //await c.query(`CREATE TABLE test (col1 string, col2 int)`);
        //await c.query(`INSERT INTO test VALUES ('Bence',2),('Anna',3),('John',4) `);
        await c.insertJSONFromPath('rows.json', { name: 'rows' });


        setConnection(c);

        setIsDbInitialized(true);
    }

    const runQuery = async () => {
        try {
            let queryData = await connection.query(queryString);
            console.log(queryData);

            setMyData(queryData);
            setRows(queryData.schema.fields.map((d) => d.name));
            setCells(queryData.toArray().map(Object.fromEntries));

            //await connection.close();
            //formatData();
            setCanRenderData(true);
        } catch (error) {
            setErrorMsg(error);
        }
    }
    //ez a function fut le, ha betoltott az oldal
    useEffect(() => {
        loadSite();
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
                    <button onClick={() => runQuery()}>RUN</button>
                    <button>RESET</button>

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