import { useEffect,useState } from "react";
import axios from "axios";
import { BarChart } from "@mantine/charts";

function TotalSales() {
    const [data, setData] = useState([])

    useEffect(() => {
        axios.get("http://localhost:5001/sales/weekly")
        .then((res) => setData(res.data))
        .catch((err) => console.error(err))
    }, [])

    return(
        <div>
            <h2>Total Sales</h2>
            <p>Weekly revenue review</p>

            <BarChart
        h={300}
        data={data}
        dataKey="week"
        series={[{ name: "total", color: "violet.6" }]}
        tickLine="y"
      />
        </div>
    )
}

export default TotalSales