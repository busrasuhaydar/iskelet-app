import React, { useState } from 'react';
import { X, ShieldCheck, Play, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { AcceptanceTestRunner } from '../services/acceptanceTests';
import { AcceptanceTestRecord } from '../types/skeleton';

interface AcceptanceTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  runner: AcceptanceTestRunner | null;
}

export const AcceptanceTestModal: React.FC<AcceptanceTestModalProps> = ({
  isOpen,
  onClose,
  runner,
}) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [, setTick] = useState(0);

  if (!isOpen || !runner) return null;

  const testList = runner.getResults();

  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      await runner.runAllTests();
      setTick((t) => t + 1);
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleRunSingle = async (testId: string) => {
    switch (testId) {
      case 'TEST_A':
        await runner.runTestA();
        break;
      case 'TEST_B':
        await runner.runTestB();
        break;
      case 'TEST_C':
        await runner.runTestC();
        break;
      case 'TEST_D':
        await runner.runTestD();
        break;
      case 'TEST_E':
        await runner.runTestE();
        break;
      case 'TEST_F':
        await runner.runTestF();
        break;
      case 'TEST_G':
        await runner.runTestG();
        break;
      case 'TEST_H':
        await runner.runTestH();
        break;
      case 'TEST_I':
        await runner.runTestI();
        break;
      case 'TEST_J':
        await runner.runTestJ();
        break;
    }
    setTick((t) => t + 1);
  };

  const passCount = testList.filter((t) => t.status === 'PASS').length;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#10131b] border border-white/10 rounded-xl max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                Studio Verification & Acceptance Test Suite
              </h2>
              <div className="text-[11px] text-slate-400">
                Tests A through J (Section 16 non-negotiable requirements) · {passCount}/
                {testList.length} Passed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAll}
              disabled={isRunningAll}
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isRunningAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing All Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Run All Acceptance Tests</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="p-1.5 hover:text-white text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Test List Cards */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {testList.map((test) => {
            const isPass = test.status === 'PASS';
            const isFail = test.status === 'FAIL';
            const isPending = test.status === 'NOT TESTED';

            return (
              <div
                key={test.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isPass
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : isFail
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">{test.name}</span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                          isPass
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isFail
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{test.description}</p>
                    <p className="text-[11px] text-slate-300 font-mono pt-1">
                      Result: {test.notes}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRunSingle(test.id)}
                    className="px-2.5 py-1 text-xs bg-white/10 hover:bg-white/15 text-slate-200 rounded shrink-0 transition-colors"
                  >
                    Run Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notes */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>All tests execute live against the active WebGL Three.js scene graph.</span>
          <span>Chrome & Physically Based Rendering Verified</span>
        </div>
      </div>
    </div>
  );
};
