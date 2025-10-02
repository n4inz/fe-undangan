'use client';
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
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title } from 'chart.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title);


// Add state to manage dynamic content and for the new line graph

const GraphPayment = () => {
    const [isClient, setIsClient] = useState(false);


    // State for the new line graph (expending data)
    const [paymentData, setPaymentData] = useState([]);
    const [range, setRange] = useState('weekly'); // Default range
    const [periods, setPeriods] = useState(4); // Default number of periods to fetch

    const fetchData = async () => {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payment-graph?range=${range}&periods=${periods}`, { withCredentials: true });
        setPaymentData(response.data);
    };

    useEffect(() => {
        setIsClient(true);
        fetchData();
    }, [range, periods]); // Re-fetch expending data when range or periods change

    // Prepare data for Chart.js line graph
    // Prepare data for Chart.js line graph (showing only the start date, reversed order)
    const lineChartData = {
        labels: paymentData
            .slice()
            .reverse()
            .map(
                (item) =>
                    `${new Date(item.endDate).toLocaleDateString()}`
            ),
        datasets: [
            {
                label: 'Total Payment',
                data: paymentData
                    .slice()
                    .reverse()
                    .map((item) => item.paymentAmount),
                fill: false,
                borderColor: 'green',
                tension: 0.1,
            },
        ],
    };

    return (
        <>


            {/* Line Chart for Expending Data */}

            <Card>
                <CardHeader>
                    <CardTitle>Payment Graph</CardTitle>
                    <CardDescription>
                        Total payment for the selected periods.
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
                                onValueChange={(value) => setRange(value)} // Correct the onChange to onValueChange for Radix 
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
                    <div className="bg-white p-6 rounded-lg shadow-md w-full"> {/* Make the container full width */}
                        <Line
                            data={lineChartData}
                            options={{
                                responsive: true, // Ensure the chart is responsive
                                maintainAspectRatio: false, // Disable aspect ratio to allow dynamic resizing
                                plugins: {
                                    title: {
                                        display: true,
                                        text: `Total Spending for Last ${periods} ${range.charAt(0).toUpperCase() + range.slice(1)} Periods`,
                                    },
                                },
                            }}
                            height={400} // You can adjust the height as needed
                        />
                    </div>

                </CardContent>
            </Card>
        </>
    );
};

export default GraphPayment;
