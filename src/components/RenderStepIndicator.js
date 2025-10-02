import React, { useEffect, useState } from "react";

export default function RenderStepIndicator({ dataStep, dataAmount }) { // Changed to uppercase

    const [step, setStep] = useState(dataStep); // This can now be any number
    const [amount, setAmount] = useState(dataAmount); // This can now be any number
    // Ensure step does not exceed dataAmount
    const nextStep = () => {
        if (step < amount) {
            setStep(step + 1);
        }
    };
    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const stepsArray = Array.from({ length: amount }, (_, i) => i + 1); // Create a dynamic array based on dataAmount
useEffect(() => {
    setStep(dataStep);
    setAmount(dataAmount);
},[dataStep, dataAmount]);
    return (
<div className="step-indicator flex justify-center items-center relative flex-wrap"> 
      {stepsArray.map((s, index) => ( // Use the dynamic array here
        <React.Fragment key={s}>
          <div
            className={`circle ${step === s ? 'bg-[#34C759] text-white' : 'bg-[#B0B0B0] text-white'} flex items-center justify-center border-2 border-transparent rounded-full w-10 h-10 mx-1`}
          >
            {s}
          </div>
          {index < stepsArray.length - 1 && ( // Adjust condition for line rendering
            <div className="line bg-gray-500 h-0.5 w-12"></div>
          )}
        </React.Fragment>
      ))}
    </div>
    
  );
}