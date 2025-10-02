import axios from 'axios';

export const checkForm = async (formId, phoneNumber) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/form/${formId}/${phoneNumber}`
    );

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      return { data: null, error: 'Form not found' };
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return { data: null, error: error.message };
  }
};
