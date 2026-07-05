import { useCallback, useEffect, useRef, useState } from "react";
import StepA from "./StepA";
import StepB from "./StepB";
import StepC from "./StepC";
import StepD from "./StepD";
import StepE from "./StepE";
import axios from "axios";
import { useRouter, usePathname, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const LAST_STEP = 5;

const MultiStepForm = ({ onFormChange }) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSyari, setIsSyari] = useState(null);
  const [finalizationError, setFinalizationError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    cover: null,
  });

  const nextStep = () => {
    setStep((currentStep) => currentStep + 1);
    onFormChange();
  };

  const prevStep = () => {
    setStep((currentStep) => currentStep - 1);
    onFormChange();
  };

  const handleChange = (input) => (e) => {
    setFormData({ ...formData, [input]: e.target.value });
    onFormChange();
  };

  const finalStepTriggered = useRef(false); // track if it's been called

  const handleFinalStep = useCallback(async () => {
    if (finalStepTriggered.current) return; // prevent multiple calls
    finalStepTriggered.current = true;

    setFinalizationError("");
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/generate-thumbnail-ak/${params.formId}`
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      router.push(`${pathname}/success`);
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      finalStepTriggered.current = false;
      setLoading(false);
      setFinalizationError(
        error.response?.data?.message ||
          "Thumbnail gagal dibuat. Silakan coba lagi."
      );
    }
  }, [params.formId, pathname, router]);

  const checkIsSyari = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/check-foto-ak/${params.formId}`
      );

      const { data } = response.data;
      const syariTheme = data?.isSyari === true;

      setIsSyari(syariTheme);

      if (syariTheme) {
        setStep((currentStep) =>
          currentStep < 3 ? 3 : currentStep
        );
      }
    } catch (error) {
      console.error("Error checking foto mempelai:", error);
    }
  }, [params.formId]);

  useEffect(() => {
    const hasCompletedAllSteps =
      step > LAST_STEP || (isSyari === true && step === LAST_STEP);

    if (hasCompletedAllSteps) {
      handleFinalStep();
      return;
    }

    if (step === 1) {
      checkIsSyari();
    }
  }, [checkIsSyari, handleFinalStep, isSyari, step]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-blue-500">Loading, please wait...</p>
      </div>
    );
  }

  if (finalizationError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-red-600">{finalizationError}</p>
        <Button onClick={handleFinalStep}>Coba Lagi</Button>
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
          partName="foto-anak"
          title="Foto Anak"
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
          partName="gallery"
          title="Gallery"
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
          partName="cover-bawah"
          title="Cover Bawah"
          number={5}
        />
      );
    default:
      return null;
  }
};

export default MultiStepForm;
