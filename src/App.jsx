import React, { useEffect, useState } from "react";

import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
import * as arrow from 'apache-arrow';


function App() {
    const [myData, setMyData] = useState(null);
    //ideiglenes default value
    const [queryString, setQueryString] = useState("SELECT * FROM test");
    //const [headers, setHeaders] = useState([]);


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
        setMyData(queryData);

        //setMyData(queryData)
        await c.close();

        return queryData;
    }

    const formatData = (data) => {
        headers = data;
    }

    const funcOrder = async () => {
        const table = await loadSite();
        setMyData(table);
        //console.log(myData, 'ize');
        return table;

    }



    useEffect(() => {
        //fetch('rows.json').then(response => {
        //response.json().then(data => {
        //loadSite(data);
        //})
        //})
        funcOrder().then(data => (data = probaertek))
        console.log(1);
        console.log(myData, 3);
        console.log(2);

        //let tempData = loadSite();

        //setMyData(tempData);
        //console.log(tempData, 'hello');
        //let rows = tempData.toArray().map(Object.fromEntries);
        //console.log(rows, 'uzenet')
    }, [])

    useEffect(() => {
        probaertek = myData.schema.field.map((d) => d.name);
        console.log(probaertek, 'hello');
    }, [myData])


    //console.log(queryData, 'bencus')


    //const formatData = async (data) => {
    // await console.log(data, 'hello');
    //await setHeaders(data.schema.fields.map((d) => d.name));
    //await console.log(headers[0]);
    //}
    //myData.value = data.schema.fields.map((d) => d.value);
    //const proba = data.map((d) => get(d));



    //setRows(rows);
    //rows.columns = myData.schema.fields.map((d) => d.name);
    //console.log(rows);

    //console.log()
    //console.log(rows.length, 'hello');
    //console.log(data.get(0).toJSON());

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
            <button onClick={() => loadSite(queryString)}>RUN</button>
            <button>RESET</button>

            <table>
                <tbody>
                    <tr>
                        <td>hello</td>
                        <td>{myData != null ? probaertek : 'loading...'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )

}

export default App;