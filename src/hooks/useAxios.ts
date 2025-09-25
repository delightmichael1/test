import axios from "axios";

const useAxios = () => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "X-Platform": "client",
      "Content-Type": "application/json",
    },
  });

  return axiosInstance;
};

export default useAxios;
