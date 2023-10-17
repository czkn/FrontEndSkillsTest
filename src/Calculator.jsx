import {useEffect, useReducer, useState} from 'react';
import { evaluate } from 'mathjs';
import './Calculator.css';

function evaluateExpression(expression) {
    try {
        return evaluate(expression);
    } catch (error) {
        console.error(error);
        return "Error";
    }
}

async function fetchExchangeRates(date) {
    const apiUrl = `https://api.nbp.pl/api/exchangerates/tables/a/${date}/`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates from NBP API");
        }
        const data = await response.json();
        return data[0].rates;
    } catch (error) {
        console.error(error);
        return {};
    }
}

function reducer(state, action) {
    switch (action.type) {
        case 'NUMBER':
        case 'OPERATOR':
            return { ...state, input: state.input + action.payload };
        case 'DECIMAL':
            if (state.input.includes('.')) return state;
            return { ...state, input: state.input + '.' };
        case 'EQUALS':
            try {
                const result = evaluateExpression(state.input);
                return { ...state, input: String(result), result: result };
            } catch (error) {
                return { ...state, input: "Error", result: 0 };
            }
        case 'CURRENCY':
            const exchangeRate = action.payload;
            let convertedResult;
            if (state.input !== "") {
                convertedResult = state.input / exchangeRate;
            } else {
                convertedResult = state.result / exchangeRate;
            }

            return { ...state, result: convertedResult, input: String(convertedResult), isNewCalculation: true };
        case 'CLEAR':
            return initialState;
        default:
            return state;
    }
}

function Button({ value, onClick }) {
    return (
        <div className="cell">
            <input type="button" value={value} onClick={() => onClick(value)} />
        </div>
    );
}


const initialState = {
    input: "",
    result: 0
};

function Calculator() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [exchangeRates, setExchangeRates] = useState({ GBP: 0, EUR: 0, USD: 0 });

    useEffect(() => {
        const fetchRates = async () => {
            const date = '2023-10-12';
            const rates = await fetchExchangeRates(date);
            setExchangeRates({
                GBP: rates.find(rate => rate.code === 'GBP').mid,
                EUR: rates.find(rate => rate.code === 'EUR').mid,
                USD: rates.find(rate => rate.code === 'USD').mid
            });
        };
        fetchRates();
    }, []);

    const handleButtonClick = (value) => {
        if (["+", "-", "*", "/"].includes(value)) {
            dispatch({ type: 'OPERATOR', payload: value });
        } else if (!isNaN(value)) {
            dispatch({ type: 'NUMBER', payload: value });
        } else {
            switch (value) {
                case 'C':
                    dispatch({ type: 'CLEAR' });
                    break;
                case '=':
                    dispatch({ type: 'EQUALS' });
                    break;
                case '.':
                    dispatch({ type: 'DECIMAL' });
                    break;
                case 'GBP':
                    dispatch({ type: 'CURRENCY', payload: exchangeRates.GBP });
                    break;
                case 'EUR':
                    dispatch({ type: 'CURRENCY', payload: exchangeRates.EUR });
                    break;
                case 'USD':
                    dispatch({ type: 'CURRENCY', payload: exchangeRates.USD });
                    break;
                default:
                    break;
            }
        }
    }

    const buttonData = ["1", "2", "3", "+", "4", "5", "6", "-", "7", "8", "9", "*", "0", ".", "C", "/", "=", "GBP", "EUR", "USD"];

    return (
        <div id="calculator">
            <div className="cell" id="result-holder">
                <input type="text" id="result" value={state.input || state.result} readOnly />
            </div>
            {buttonData.map((value, index) => (
                <Button key={index} value={value} onClick={handleButtonClick} />
            ))}
        </div>
    );
}

export default Calculator;