import { useState, useEffect } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js'; // Ensure Tooltip and Legend are imported

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend); // Register Tooltip and Legend

const AnalysisGraph = () => {
    const [analysisData, setAnalysisData] = useState([]);
    const [range, setRange] = useState('weekly'); // Default range
    const [periods, setPeriods] = useState(4); // Default number of periods

    useEffect(() => {
        // Fetch analysis data from API
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analysis-graph?range=${range}&periods=${periods}`,
                    {
                        withCredentials: true, // Include credentials (cookies, authentication) with the request
                    });
                setAnalysisData(response.data);
            } catch (error) {
                console.error('Error fetching analysis data:', error);
            }
        };

        fetchData();
    }, [range, periods]);

    // Prepare the data for the line chart (without the difference dataset)
    const chartData = {
        labels: analysisData
            .slice()
            .reverse() // Reverse the data order to show from latest to oldest
            .map((item) => new Date(item.startDate).toLocaleDateString()), // Display only start date
        datasets: [
            {
                label: 'Total Selisih',
                data: analysisData
                    .slice()
                    .reverse()
                    .map((item) => item.difference),
                fill: false,
                borderColor: analysisData
                    .slice()
                    .reverse()
                    .map((item) => item.difference < 0 ? 'red' : 'green'),
                tension: 0.1,
                segment: {
                    borderColor: (ctx) => {
                        const { p0, p1 } = ctx; // p0 is the previous point, p1 is the current point
                        return p1.parsed.y < p0.parsed.y ? 'red' : 'green'; // Red if the line goes down
                    },
                },
            }
        ],
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Analysis Graph</CardTitle>
                <CardDescription>
                    Compare total spending and payments over the selected periods.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Range selection */}
                <div className="flex justify-center items-center mb-4 space-x-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Select Range: </label>
                        <Select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-200"
                            value={range}
                            onValueChange={(value) => setRange(value)} // Correct onValueChange for Radix Select
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Number of periods */}
                    <div>
                        <label className="block text-gray-700 mb-2">Select Number of Periods: </label>
                        <Input
                            type="number"
                            value={periods}
                            onChange={(e) => setPeriods(e.target.value)}
                            min="1"
                            max="52"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-200"
                        />
                    </div>
                </div>

                {/* Line chart displaying the expending data */}
                <div className="bg-white p-6 rounded-lg shadow-md w-full">
                    <Line
                        data={chartData}
                        options={{
                            responsive: true, // Ensure the chart is responsive
                            maintainAspectRatio: false, // Disable aspect ratio to allow dynamic resizing
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Total Selisih for Last ${periods} ${range.charAt(0).toUpperCase() + range.slice(1)} Periods`,
                                },
                            },
                        }}
                        height={400} // You can adjust the height as needed
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default AnalysisGraph;
