require('dotenv').config();
const express = require("express")
const axios = require("axios");

const app = express();
const apiKey = process.env.API_KEY;
const port = process.env.PORT;

const checkCondition = (op1, op2, operator) => {
    switch (operator) {
        case "equals":
            return op1 === op2;
        case "does_not_equal":
            return op1 != op2;
        case "greater_than":
            return op1 > op2;
        case "less_than":
            return op1 < op2;
    }
};

app.get("/:formId/filteredResponses", async (req, res) => {
    try {
        const formId = req.params.formId;
        const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
        const response = await axios.get(
            `https://api.fillout.com/v1/api/forms/${formId}/submissions`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
                params: {
                    filters: JSON.stringify(filters),
                },
            }
        );

        const { responses } = response.data;

        let filteredResponse = responses.flatMap(({ questions }) =>
            questions.filter(({ id, value }) =>
                filters.every(({ id: queryId, condition: queryCondition, value: queryValue }) =>
                    id === queryId && checkCondition(queryValue, value, queryCondition)
                )
            )
        );

        const results = {
            responses: {
                questions: filteredResponse,
                totalResponses: filteredResponse.length,
                pageCount: Math.ceil(filteredResponse.length / 20),
            },
        };

        res.json(results);
    } catch (error) {
        console.error("Error fetching filtered responses:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
