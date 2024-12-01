
async function getAPICalendar() {
    try {
        const response = await fetch("https://hook.us2.make.com/3deq1qv08ahw2k44khs549ulya67r9xc");
        const data = await response.json();
        //console.log(data);
        const documents = [];
        data.forEach(doc => {
            documents.push(`Data: ${JSON.stringify(doc)}`);
        });
        //console.log(documents.join("\n"));
        return documents.join("\n");
    } catch (error) {
        console.error('Error al obtener los eventos:', error);
    }
    }

module.exports = { getAPICalendar };