import { useEffect, useState, useRef } from "react";
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
import StepI1 from "./StepI1";
import { Toaster } from "../ui/toaster";
import { max } from "date-fns";

const MultiStepForm = ({ onFormChange }) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname()
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSyari, setIsSyari] = useState(false);
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
  const checkIsSyari = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/check-foto-mempelai/${params.formId}/${params.phoneNumber}`
      );

      const { data } = response.data;
      if (data && data.isSyari == true && step === 12) {
        handleFinalStep();
      }
      else if (data && data.isSyari == true && step >= 6) {
        handleFinalStep();
      }
      else if (data && data.isSyari == true && step < 10) {
        setStep(3);
        setIsSyari(true);
      }
      else if (data && data.isSyari != true && step >= 10) {
        setStep(10);
      }

    } catch (error) {
      console.error("Error checking foto mempelai:", error);
    }
  };

  useEffect(() => {
    if (step == 1) {
      checkIsSyari();
    }    
    if (step === 3) {
      checkFotoMempelai();
    }
    if (step === 7) {
      checkIsSyari();
      checkFotoLoveStory();
    }
    if (step === 10) {
      checkIsSyari();
    }

    console.log("STEP:", step);
  }, [step]);

  const finalStepTriggered = useRef(false); // track if it's been called

  const handleFinalStep = async () => {
    if (finalStepTriggered.current) return; // prevent multiple calls
    finalStepTriggered.current = true;

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/generate-thumbnail/${params.formId}`
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      await router.push(`${pathname}/success`);
    } catch (error) {
      console.error("Error generating thumbnail:", error);
    } finally {
      setLoading(false);
    }
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
          title="Cover"
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
          title="Sub Cover"
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
          title="Mempelai Pria"
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
          title="Mempelai Wanita"
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
          title="Mempelai Pria & Wanita"
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
          title="Gallery"
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
          title="Awal Ketemu"
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
          title="Komitmen"
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
          title="Lamaran"
          number={8}
        />
      );
    case 10:
      return (
        <StepI1
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="cover-bawah"
          title="Cover Bawah"
          number={9}
        />
      );
    case 11:
      return (
        <StepJ
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
          onFormChange={onFormChange}
          partName="background"
          title="Background"
          number={10} />
      );
    default:
      handleFinalStep();
      return null;
  }
};

export default MultiStepForm;
