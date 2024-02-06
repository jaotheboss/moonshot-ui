type CircleArrowRightIconProps = {
  outlineColor: string;
  width?: number;
  height?: number;
};

function CircleArrowRightIcon(props: CircleArrowRightIconProps) {
  const { outlineColor = '#FFFFFF', width = 30, height = 30 } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={outlineColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="feather feather-arrow-right-circle">
      <circle
        cx="12"
        cy="12"
        r="10"
      />
      <polyline points="12 16 16 12 12 8" />
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
      />
    </svg>
  );
}

export { CircleArrowRightIcon };
