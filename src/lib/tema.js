import axios from "axios";

export const getTema = async () => {
    try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-tema`);
        return data;
    } catch (error) {
        console.log(error);
    }
};