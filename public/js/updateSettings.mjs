import { showAlert } from "./alert.mjs";
import axiosInstance from "./axiosInstance.js";

// type is string and its either a data or password
export const updateSettings = async (data, type) => {
    try {
        const res = await axiosInstance({
            method: 'PATCH',
            url: `/users/${type === 'password' ? 'updateMyPassword' : 'updateMe'}`,
            data
        });
        if (res.data.status === 'success') {
            //console.log('Data: ', res.data)
            showAlert('success', `${type.toUpperCase()} has been updated successfully!!`);
        }

    } catch (error) {
        showAlert('error', error.response.data.message);
        //console.log('Error', error.response.data.message)
    }
}
