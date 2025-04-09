import axios from "axios";

export const getBankList = async () => {
    try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bank-list`);
        return data || []; // Ensure an array is returned
    } catch (error) {
        console.error("Error fetching bank list:", error);
        return []; // Return an empty array on error
    }
};