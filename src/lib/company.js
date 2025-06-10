import axios from "axios";

export const getCompanyProfile = async () => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/company`);
        // Check the response structure in your API docs or logs
        return response.data; // Adjust based on API: response.data or response.data.data
    } catch (error) {
        console.error("Error fetching company profile:", error);
        throw error; // Throw error to handle in the parent component
    }
};

export const getBankAccounts = async () => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bank-accounts`);
        return response.data || []; // Ensure an array is returned
    } catch (error) {
        console.error("Error fetching bank list:", error);
        return []; // Return an empty array on error
    }
};