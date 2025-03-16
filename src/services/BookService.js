import axios from 'axios';

function createAxios() {
    return axios.create({
        baseURL: 'https://openlibrary.org/',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

let apiClient = createAxios();

class Requester {
    async get(url, headers = {}) {
        try {
            const response = await apiClient.get(url, { headers });
            return response.data; // Devuelve solo los datos del backend
        } catch (error) {
            console.error('Error en la solicitud GET:', error);
            return null; // Devuelve null en caso de error
        }
    }
}

const requester = new Requester();

export default {
    async getTrendingBooks() {
        return await requester.get('/trending/daily.json');
    },
    async getBookByKey(key) {
        return await requester.get(`${key}.json`);
    }
};
