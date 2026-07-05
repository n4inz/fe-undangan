import axios from "axios";

export const getTema = async (formId = null) => {
    try {
        const endpoint = formId
            ? `${process.env.NEXT_PUBLIC_API_URL}/get-tema/${formId}`
            : `${process.env.NEXT_PUBLIC_API_URL}/get-tema`;
        const { data } = await axios.get(endpoint);
        return data;
    } catch (error) {
        console.log(error);
    }
};

export const getTemaAk = async (formId = null) => {
    try {
        const endpoint = formId
            ? `${process.env.NEXT_PUBLIC_API_URL}/get-tema-ak/${formId}`
            : `${process.env.NEXT_PUBLIC_API_URL}/get-tema-ak`;
        const { data } = await axios.get(endpoint);
        return data;
    } catch (error) {
        console.log(error);
    }
};