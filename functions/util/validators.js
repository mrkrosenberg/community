// Input Validation Helpers
const isEmail = (email) => {

    const emailTemplate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(emailTemplate)) return true;
    else return false;
};

const isEmpty = (string) => {

    if(string.trim() === '') return true;
    else return false
};

// Message variables
const emtpyErrorMessage = 'Must not be empty';
const emailErrorMessage = 'Must be a valid email address';
const passwordErrorMessage = 'Passwords must match';

// Signup Validation
exports.validateSignupData = (data) => {

        // Validate sign up data
        let errors = {};

        if(isEmpty(data.email)) {
            errors.email = emtpyErrorMessage;
        } else if(!isEmail(data.email)) {
            errors.email = emailErrorMessage;
        }
    
        if(isEmpty(data.password)) {
            errors.password = emtpyErrorMessage;
        } 
    
        if(data.password !== data.confirmPassword) {
            errors.confirmPassword = passwordErrorMessage;
        }
    
        if(isEmpty(data.handle)) {
            errors.handle = emtpyErrorMessage;
        }

        return {
            errors,
            valid: Object.keys(errors).length === 0 ? true : false
        }
};

// Login Validation
exports.validateLoginData = (data) => {

        let errors = {};

        if(isEmpty(data.email)) {
            errors.email = emtpyErrorMessage;
        }
        if(isEmpty(data.password)) {
            errors.password = emtpyErrorMessage;
        }
        if(Object.keys(errors).length > 0) {
            return res.status(400).json(errors)
        } 
        
        return {
            errors,
            valid: Object.keys(errors).length === 0 ? true : false
        }
};

// Update Profile bio, website, location
exports.reduceUserDetails = (data) => {

    let userDetails = {};

    if(!isEmpty(data.bio.trim())) {
        userDetails.bio = data.bio
    }
    if(!isEmpty(data.website.trim())) {
        if(data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website  = `http://${data.website.trim()}`
        } else {
            userDetails.website = data.website;
        }
    }
    if(!isEmpty(data.location.trim())) {
        userDetails.location = data.location;
    }

    return userDetails;
};