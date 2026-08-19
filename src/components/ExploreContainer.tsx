interface ContainerProps {}

const ExploreContainer: React.FC<ContainerProps> = () => {
  return (
    <div className="text-center absolute left-0 right-0 top-1/2 -translate-y-1/2">
      <strong className="text-xl leading-6">Ready to create an app?</strong>
      <p className="text-base leading-5 text-gray-400 m-0">
        Start with Ionic{" "}
        <a
          className="no-underline text-blue-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://ionicframework.com/docs/components"
        >
          UI Components
        </a>
      </p>
    </div>
  );
};

export default ExploreContainer;
