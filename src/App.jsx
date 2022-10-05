import React, { useEffect, useState } from "react";

import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import * as arrow from 'apache-arrow';


function App() {
    const [myData, setMyData] = useState([]);
    //ideiglenes default value
    const [queryString, setQueryString] = useState("SELECT * FROM test");
    let probaertek;


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

        //await db.registerFileText(jsonData);
        //await c.insertJSONFromPath('columns.json', { name: 'columns' });

        await c.query(`CREATE TABLE test (col1 string, col2 int)`);
        await c.query(`INSERT INTO test VALUES ('Bence',2),('Anna',3) `);
        let queryData = await c.query(`SELECT * FROM test`);

        await c.close();
        return queryData;
    }

    const funcOrder = async () => {
        const table = await loadSite();
        probaertek = table;
        await setMyData(table.toArray());
        await console.log(myData, '1');
    }

    const formatData = () => {
    }


    //ez a function fut le, ha betoltott az oldal
    useEffect(() => {
        funcOrder()
        console.log(myData, 2);

    }, [])

    if (myData != null) {
        formatData();
    }

    //setMyData is asznc function a useState-bol adodoan, ezert irtam ezt a useEffectet, ami elvileg akkor kellene lefusson,
    //mikor a myData frissul. De ez a function egyszer sem kerul meghivasra.
    useEffect(() => {

    }, [myData])

    return (
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
            <button onClick={() => console.log(myData)}>RUN</button>
            <button>RESET</button>

            <table>
                <tbody>
                    <tr>
                        <td>hello</td>
                        <>{myData != null ? myData : 'loading...'}</>
                    </tr>
                </tbody>
            </table>
        </div>
    )

}

export default App;