import { Icon, IconName } from '@/app/components/IconSVG';

type RecipeItemCardProps = {
  endpoint: LLMEndpoint;
};

function RecipeItemCard(props: RecipeItemCardProps) {
  const { endpoint } = props;
  return (
    <div className="flex flex-col items-start py-2">
      <div className="flex items-center gap-2 pb-2">
        <Icon
          name={IconName.SolidBox}
          size={16}
          lightModeColor="#475569"
          darkModeColor="#475569"
        />
        <div className="font-bold">{endpoint.name}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="font-medium">Type:</div>
        <div>{endpoint.type}</div>
      </div>
      <div className="flex items-center gap-2">
        <div>{endpoint.uri}</div>
      </div>
    </div>
  );
}

export { RecipeItemCard };