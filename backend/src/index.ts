import app from './app'
import { start_stop_event_backstop } from './jobs/stop_event_backstop';

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log("Server running on port", PORT)
// });

const PORT = Number(process.env.port?? 3000);

//bind to all interfaces so app is reachable from multiple devices/platforms
app.listen(PORT, '0.0.0.0', () =>{
	console.log(`Server running on port ${PORT}`);
	start_stop_event_backstop();
});

