import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, TimerAction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    pkg_nav = get_package_share_directory('runway_navigation')
    pkg_desc = get_package_share_directory('runway_description')

    world_name = LaunchConfiguration('world_name')
    use_rviz = LaunchConfiguration('use_rviz')
    use_ekf = LaunchConfiguration('use_ekf')

    world_name_arg = DeclareLaunchArgument(
        'world_name',
        default_value='airport_runway',
        description='Simulation world name: "airport_runway" or "nus_ea_field"'
    )

    use_rviz_arg = DeclareLaunchArgument(
        'use_rviz',
        default_value='true',
        description='Launch RViz2 if true'
    )

    use_ekf_arg = DeclareLaunchArgument(
        'use_ekf',
        default_value='true',
        description='Launch RTK-GNSS + IMU Dual-EKF localization pipeline if true'
    )

    # 1. Gazebo Simulation launcher (Spawns world, UGV model, sensor bridges, /clock)
    gazebo_sim = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_desc, 'launch', 'sim.launch.py')
        ),
        launch_arguments={
            'world_name': world_name,
        }.items()
    )

    # 2. Nav2 Autonomous Navigation + RViz2
    # Delayed by 3.5 seconds to give Gazebo Harmonic time to initialize /clock and GUI
    nav2_bringup = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav, 'launch', 'bringup_nav2.launch.py')
        ),
        launch_arguments={
            'world_name': world_name,
            'use_rviz': use_rviz,
            'use_ekf': use_ekf,
        }.items()
    )

    delayed_nav2 = TimerAction(
        period=3.5,
        actions=[nav2_bringup]
    )

    return LaunchDescription([
        world_name_arg,
        use_rviz_arg,
        use_ekf_arg,
        gazebo_sim,
        delayed_nav2,
    ])
