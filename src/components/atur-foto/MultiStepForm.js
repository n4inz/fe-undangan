import { useEffect, useState } from "react";
import StepA from "./StepA";
import StepB from "./StepB";
import StepC from "./StepC";
import StepD from "./StepD";
import StepE from "./StepE";
import StepF from "./StepF";
import StepG from "./StepG";
import StepH from "./StepH";
import StepI from "./StepI";
import StepJ from "./StepJ";
import axios from "axios";
import { useRouter, usePathname, useParams } from "next/navigation";

const MultiStepForm = ({ onFormChange }) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname()
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    cover: null,
  });

  const nextStep = () => {
    if (step === 4) {
      setStep(step + 2);
    } else {
      setStep(step + 1);
    }
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

  const checkFotoMempelai = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/check-foto-mempelai/${params.formId}/${params.phoneNumber}`
      );

      const { data } = response.data;
      if (data && data.totalWeddingPhoto === 1) {
        setStep(5);
      }
    } catch (error) {
      console.error("Error checking foto mempelai:", error);
    }
  };
  const checkFotoLoveStory = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/check-foto-mempelai/${params.formId}/${params.phoneNumber}`
      );

      const { data } = response.data;
      if (data && data.loveStory == false) {
        setStep(10);
      }
    } catch (error) {
      console.error("Error checking foto mempelai:", error);
    }
  };

  useEffect(() => {
    if (step === 3) {
      checkFotoMempelai();
    }
    if (step === 7) {
      checkFotoLoveStory();
    }
    console.log("STEP:", step);
  }, [step]);

  const handleFinalStep = async () => {
    setLoading(true);  // Show loading indicator
    await router.push(`${pathname}/success`);
    setLoading(false); // Hide loading indicator after navigation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-blue-500">Loading, please wait...</p>
      </div>
    );
  }

  switch (step) {
    case 1:
      return (
        <StepA
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="cover"
          number={1}
        />
      );
    case 2:
      return (
        <StepB
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="subcover"
          number={2}
        />
      );
    case 3:
      return (
        <StepC
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="mempelai-pria"
          number={3}
        />
      );
    case 4:
      return (
        <StepD
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="mempelai-wanita"
          number={4}
        />
      );
    case 5:
      return (
        <StepE
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="mempelai-pria-wanita"
          number={3}
        />
      );
    case 6:
      return (
        <StepF
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="gallery"
          number={5}
        />
      );
    case 7:
      return (
        <StepG
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="awal-ketemu"
          number={6}
        />
      );
    case 8:
      return (
        <StepH
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="komitmen"
          number={7}
        />
      );
    case 9:
      return (
        <StepI
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="lamaran"
          number={8}
        />
      );
    case 10:
      return (
        <StepJ
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="background"
          number={9}
        />
      );
    default:
      handleFinalStep();
      return null;
  }
};

export default MultiStepForm;
