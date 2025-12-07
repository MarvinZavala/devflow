"use client"

import React, { useState, Children, useRef, useLayoutEffect, ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepperProps {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  className?: string;
}

export function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  className
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className={cn("flex flex-col w-full", className)}>
      <div className="w-full max-w-2xl mx-auto">
        {/* Step Indicators */}
        <div className="flex w-full items-center justify-between mb-8 px-4">
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                <StepIndicator
                  step={stepNumber}
                  currentStep={currentStep}
                  onClickStep={clicked => {
                    if (clicked < currentStep) { // Only allow going back by clicking
                        setDirection(-1);
                        updateStep(clicked);
                    }
                  }}
                />
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="relative overflow-hidden bg-zinc-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl min-h-[300px]">
            <StepContentWrapper
              isCompleted={isCompleted}
              currentStep={currentStep}
              direction={direction}
              className="p-8"
            >
              {stepsArray[currentStep - 1]}
            </StepContentWrapper>

            {/* Footer Actions */}
            {!isCompleted && (
              <div className="p-6 border-t border-white/5 flex justify-between items-center bg-zinc-950/30 backdrop-blur-sm">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={cn("transition-opacity", currentStep === 1 ? "opacity-0 pointer-events-none" : "opacity-100")}
                  >
                    {backButtonText}
                  </Button>
                  
                  <Button
                    onClick={isLastStep ? handleComplete : handleNext}
                    className={cn(
                        "rounded-full px-6 font-medium shadow-lg shadow-orange-500/10 transition-all hover:scale-105",
                        isLastStep 
                            ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" 
                            : "bg-primary text-primary-foreground"
                    )}
                  >
                    {isLastStep ? 'Finish Setup' : nextButtonText}
                  </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : 'auto' }} // Auto height is better usually, but parentHeight ensures smooth transition
      transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={h => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  // We don't strictly need height calc if we use 'auto', but for strict smooth resizing:
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 20 : -20,
    opacity: 0,
    filter: "blur(10px)"
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)"
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -20 : 20,
    opacity: 0,
    filter: "blur(10px)"
  })
};

export function Step({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
}

function StepIndicator({ step, currentStep, onClickStep }: StepIndicatorProps) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  return (
    <motion.div
      onClick={() => onClickStep(step)}
      className="relative cursor-pointer outline-none focus:outline-none z-10"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: '#27272a', color: '#71717a', border: '1px solid #3f3f46' }, // zinc-800/500
          active: { scale: 1.1, backgroundColor: '#f97316', color: '#ffffff', border: '1px solid #f97316' }, // orange-500
          complete: { scale: 1, backgroundColor: '#10b981', color: '#ffffff', border: '1px solid #10b981' } // emerald-500
        }}
        transition={{ duration: 0.3 }}
        className="flex h-10 w-10 items-center justify-center rounded-full font-semibold shadow-lg"
      >
        {status === 'complete' ? (
          <Check className="h-5 w-5 text-white" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  return (
    <div className="relative mx-2 h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
      <motion.div
        className="absolute left-0 top-0 h-full"
        initial={{ width: "0%" }}
        animate={{ 
            width: isComplete ? "100%" : "0%",
            backgroundColor: isComplete ? "#10b981" : "transparent" // emerald-500
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </div>
  );
}
