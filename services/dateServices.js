const getDate = () => {
    let options = { weekday: 'long', month: 'long', day: 'numeric' };
    let today = new Date();
    return today.toLocaleDateString("en-US", options);
}

const getWeekDay = () => {
    let options = { weekday: 'long' };
    let today = new Date();
    return today.toLocaleDateString("en-US", options);
}

const getNumericDay = () => {
    let options = { day: 'numeric' };
    let today = new Date();
    return today.toLocaleDateString("en-US", options);
}

const getMonth = () => {
    let options = { month: 'long' };
    let today = new Date();
    return today.toLocaleDateString("en-US", options);
}

const getFullYear = () => {
    let options = { year: 'numeric' };
    let today = new Date();
    return today.toLocaleDateString("en-US", options);
}

export { getDate, getWeekDay, getNumericDay, getMonth, getFullYear };