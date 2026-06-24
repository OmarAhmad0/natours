//import axios from 'https://jsdelivr.net';
//import axios from "axios";
import { showAlert } from "./alert.mjs";
import axiosInstance from "./axiosInstance.js";

export const login = async (email, password) => {
    try {
        const res = await axiosInstance({
            method: 'POST',
            url: '/users/login',
            data: {
                email,
                password
            }
        });
        if (res.data.status === 'success') {
            showAlert('success', "Logged in successfully!!");
            window.setTimeout(() => {
                location.assign('/');
            }, 500)
        }

    } catch (error) {
        showAlert('error', error.response.data.message);
    }
}

export const logout = async () => {
    try {
        const res = await axiosInstance({
            method: 'GET',
            url: '/users/logout',
        })
        if (res.data.status === 'success') location.reload(true);
    } catch (error) {
        showAlert('error', 'Error logging out!, Try again.')
    }
}

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axiosInstance({
            method: 'POST',
            url: '/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm
            }
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Account created successfully! Welcome to Natours.');
            window.setTimeout(() => {
                location.assign('/');
            }, 2500);
        } else {
            console.log(`Here is what happend ${res.data.status}`)
        }
    } catch (err) {
        showAlert('error', `${err.response.data.message}`);
    }
};