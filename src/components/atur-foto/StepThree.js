const StepThree = ({ prevStep, formData }) => {
    return (
      <div>
        <h2>Step 3: Enter Your Address</h2>
        <input
          type="text"
          placeholder="Enter your address"
          value={formData.address}
          readOnly
        />
        <button onClick={prevStep}>Back</button>
        <button onClick={() => alert("Form Submitted!")}>Submit</button>
      </div>
    );
  };
  
  export default StepThree;
  