import { useUser } from "@/contexts/UserContext";

export default function SimpleDashboard() {
  const { user } = useUser();
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user.displayName}</h1>
        <p className="text-gray-500">Let's continue your healing journey today</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Health Journey</h2>
          <p className="mb-2">Cancer Type: {user.cancerType || "Not specified"}</p>
          <p className="mb-2">Cancer Stage: {user.cancerStage || "Not specified"}</p>
          <p className="mb-6">Diagnosis Date: {user.diagnosis_date || "Not specified"}</p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded text-center">
              <p className="font-bold text-blue-700">3</p>
              <p className="text-sm">Appointments</p>
            </div>
            <div className="bg-green-100 p-2 rounded text-center">
              <p className="font-bold text-green-700">7</p>
              <p className="text-sm">Activities</p>
            </div>
            <div className="bg-purple-100 p-2 rounded text-center">
              <p className="font-bold text-purple-700">12</p>
              <p className="text-sm">Meals</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">AI Health Assistant</h2>
          <div className="bg-gray-100 p-3 rounded-lg mb-4 text-gray-700">
            How can I help you with your healing journey today?
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Ask about nutrition, stress relief, etc."
              className="flex-1 p-2 border rounded"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Send
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="font-medium">Oncology Appointment</p>
              <p className="text-sm text-gray-500">Dr. Sarah Thompson</p>
            </div>
            <div className="text-right">
              <p className="font-medium">May 22, 2025</p>
              <p className="text-sm text-gray-500">9:30 AM</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="font-medium">Nutrition Consultation</p>
              <p className="text-sm text-gray-500">Maria Rodriguez, RD</p>
            </div>
            <div className="text-right">
              <p className="font-medium">May 25, 2025</p>
              <p className="text-sm text-gray-500">2:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}