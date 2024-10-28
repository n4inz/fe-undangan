import { useState } from "react";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";

const MultiStepForm = ({ onFormChange }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    cover: null,
  });

  const nextStep = () => {
    setStep(step + 1);
    onFormChange();
  };

  const prevStep = () => {
    setStep(step - 1);
    onFormChange();
  };

  const handleChange = (input) => (e) => {
    setFormData({ ...formData, [input]: e.target.value });
    onFormChange();
  };

  switch (step) {
    case 1:
      return (
        <StepOne
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="cover"
        />
      );
    case 2:
      return (
        <StepTwo
        nextStep={nextStep}
        formData={formData}
        setFormData={setFormData}
        onFormChange={onFormChange}
        partName="subcover"
        />
      );
    case 3:
      return <StepThree prevStep={prevStep} formData={formData} />;
    default:
      return <h1>Error</h1>;
  }
};

export default MultiStepForm;
