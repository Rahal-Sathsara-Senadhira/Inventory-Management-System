import { useRef } from "react";
import StatementToolbar from "./StatementToolbar";
import StatementPreview from "./StatementPreview";

const StatementTab=()=> {
  const printRef = useRef();

  return (
    <div className="space-y-4">
      <StatementToolbar printRef={printRef} />
      <div ref={printRef}>
        <StatementPreview />
      </div>
    </div>
  );
}

export default StatementTab